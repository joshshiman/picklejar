from datetime import datetime
from typing import List

from database import get_db
from fastapi import APIRouter, Depends, HTTPException, status
from models import Member, PickleJar, Suggestion
from schemas import (
    MessageResponse,
    PickleJarCreate,
    PickleJarDetailResponse,
    PickleJarResponse,
    PickleJarStatsResponse,
    PickleJarUpdate,
    ResultsResponse,
    SuggestionWithVotesResponse,
    WinnerResponse,
)
from sqlalchemy.orm import Session

router = APIRouter()


@router.post("/", response_model=PickleJarResponse, status_code=status.HTTP_201_CREATED)
def create_picklejar(picklejar: PickleJarCreate, db: Session = Depends(get_db)):
    """
    Create a new PickleJar.
    Returns the created PickleJar with a unique shareable link ID.

    Note:
    - In the minimal flow, `creator_phone` may be omitted. When it is not
      provided, we do not auto-create a host member; members join later via
      the join endpoint.
    """
    db_picklejar = PickleJar(
        title=picklejar.title,
        description=picklejar.description,
        points_per_voter=picklejar.points_per_voter,
        max_suggestions_per_member=1000,  # Effectively unlimited
        suggestion_deadline=picklejar.suggestion_deadline,
        voting_deadline=picklejar.voting_deadline,
        hangout_datetime=picklejar.hangout_datetime,
        creator_phone=picklejar.creator_phone,
        status="setup",
    )

    db.add(db_picklejar)
    db.commit()
    db.refresh(db_picklejar)

    # Automatically add creator as first member only if a phone was provided
    if picklejar.creator_phone:
        creator_member = Member(
            picklejar_id=db_picklejar.id,
            phone_number=picklejar.creator_phone,
            display_name="Host",
            is_verified=False,
        )
        db.add(creator_member)
        db.commit()

    return db_picklejar


def _check_and_update_status(db_picklejar: PickleJar, db: Session):
    """
    Lazy check for deadline expiration.
    Updates status if deadlines have passed.
    """
    now = datetime.utcnow()
    changed = False

    # Check suggestion deadline
    if (
        db_picklejar.status == "suggesting"
        and db_picklejar.suggestion_deadline
        and now > db_picklejar.suggestion_deadline
    ):
        # Check if there are any suggestions before advancing
        suggestion_count = (
            db.query(Suggestion)
            .filter(Suggestion.picklejar_id == db_picklejar.id)
            .count()
        )

        # Only advance if there are suggestions (otherwise we can't calculate points)
        if suggestion_count > 0:
            # Derive points_per_voter logic (same as start_voting_phase)
            if suggestion_count > 1:
                db_picklejar.points_per_voter = max(suggestion_count - 1, 1)
            else:
                db_picklejar.points_per_voter = 1

            db_picklejar.status = "voting"
            changed = True

    # Check voting deadline
    # Note: We check this even if we just transitioned to voting
    if (
        db_picklejar.status == "voting"
        and db_picklejar.voting_deadline
        and now > db_picklejar.voting_deadline
    ):
        db_picklejar.status = "completed"
        changed = True

    if changed:
        db_picklejar.updated_at = now
        db.commit()
        db.refresh(db_picklejar)


@router.get("/{picklejar_id}", response_model=PickleJarDetailResponse)
def get_picklejar(picklejar_id: str, db: Session = Depends(get_db)):
    """
    Get a PickleJar by ID with member and suggestion counts.

    Performs a lazy check on deadlines: if suggestion or voting deadlines
    have passed, the status is automatically updated before returning.
    """
    db_picklejar = db.query(PickleJar).filter(PickleJar.id == picklejar_id).first()

    if not db_picklejar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PickleJar with id {picklejar_id} not found",
        )

    # Lazy check for deadlines
    _check_and_update_status(db_picklejar, db)

    # Get counts
    members = db.query(Member).filter(Member.picklejar_id == picklejar_id).all()
    suggestions = (
        db.query(Suggestion).filter(Suggestion.picklejar_id == picklejar_id).all()
    )

    member_count = len(members)
    suggestion_count = len(suggestions)
    members_who_suggested = sum(1 for m in members if m.has_suggested)
    members_who_voted = sum(1 for m in members if m.has_voted)

    # Convert to response model
    response = PickleJarDetailResponse(
        id=db_picklejar.id,
        title=db_picklejar.title,
        description=db_picklejar.description,
        points_per_voter=db_picklejar.points_per_voter,
        max_suggestions_per_member=db_picklejar.max_suggestions_per_member,
        suggestion_deadline=db_picklejar.suggestion_deadline,
        voting_deadline=db_picklejar.voting_deadline,
        hangout_datetime=db_picklejar.hangout_datetime,
        status=db_picklejar.status,
        is_active=db_picklejar.is_active,
        created_at=db_picklejar.created_at,
        updated_at=db_picklejar.updated_at,
        creator_phone=db_picklejar.creator_phone,
        member_count=member_count,
        suggestion_count=suggestion_count,
        members_who_suggested=members_who_suggested,
        members_who_voted=members_who_voted,
    )

    return response


@router.patch("/{picklejar_id}", response_model=PickleJarResponse)
def update_picklejar(
    picklejar_id: str, picklejar: PickleJarUpdate, db: Session = Depends(get_db)
):
    """
    Update a PickleJar's details.
    """
    db_picklejar = db.query(PickleJar).filter(PickleJar.id == picklejar_id).first()

    if not db_picklejar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PickleJar with id {picklejar_id} not found",
        )

    # Update fields if provided
    update_data = picklejar.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_picklejar, field, value)

    db_picklejar.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_picklejar)

    return db_picklejar


@router.post("/{picklejar_id}/start-suggesting", response_model=MessageResponse)
def start_suggesting_phase(picklejar_id: str, db: Session = Depends(get_db)):
    """
    Move PickleJar to the 'suggesting' phase.
    """
    db_picklejar = db.query(PickleJar).filter(PickleJar.id == picklejar_id).first()

    if not db_picklejar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PickleJar with id {picklejar_id} not found",
        )

    if db_picklejar.status != "setup":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot start suggesting phase from status '{db_picklejar.status}'",
        )

    db_picklejar.status = "suggesting"
    db_picklejar.updated_at = datetime.utcnow()
    db.commit()

    return MessageResponse(
        message="Suggesting phase started",
        detail=f"Members can now submit suggestions for '{db_picklejar.title}'",
    )


@router.post("/{picklejar_id}/start-voting", response_model=MessageResponse)
def start_voting_phase(picklejar_id: str, db: Session = Depends(get_db)):
    """
    Move PickleJar to the 'voting' phase.

    When entering the voting phase, the system derives `points_per_voter`
    automatically based on the number of suggestions:
        points_per_voter = max(suggestion_count - 1, 1)

    This value is then enforced by the voting endpoint and should not be
    configured directly by clients.
    """
    db_picklejar = db.query(PickleJar).filter(PickleJar.id == picklejar_id).first()

    if not db_picklejar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PickleJar with id {picklejar_id} not found",
        )

    if db_picklejar.status != "suggesting":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot start voting phase from status '{db_picklejar.status}'",
        )

    # Check if there are any suggestions
    suggestion_count = (
        db.query(Suggestion).filter(Suggestion.picklejar_id == picklejar_id).count()
    )

    if suggestion_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot start voting with no suggestions",
        )

    # Derive points_per_voter from the number of suggestions (n - 1, with a minimum of 1)
    if suggestion_count > 1:
        db_picklejar.points_per_voter = max(suggestion_count - 1, 1)
    else:
        # If there is only one suggestion, fall back to 1 point
        db_picklejar.points_per_voter = 1

    db_picklejar.status = "voting"
    db_picklejar.updated_at = datetime.utcnow()
    db.commit()

    return MessageResponse(
        message="Voting phase started",
        detail=(
            f"Members can now vote on {suggestion_count} suggestion(s) with "
            f"up to {db_picklejar.points_per_voter} point(s) each"
        ),
    )


@router.post("/{picklejar_id}/complete", response_model=MessageResponse)
def complete_picklejar(picklejar_id: str, db: Session = Depends(get_db)):
    """
    Complete the PickleJar and reveal results.
    """
    db_picklejar = db.query(PickleJar).filter(PickleJar.id == picklejar_id).first()

    if not db_picklejar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PickleJar with id {picklejar_id} not found",
        )

    if db_picklejar.status != "voting":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot complete from status '{db_picklejar.status}'",
        )

    db_picklejar.status = "completed"
    db_picklejar.updated_at = datetime.utcnow()
    db.commit()

    return MessageResponse(
        message="PickleJar completed",
        detail="Results are now available",
    )


@router.post("/{picklejar_id}/revert-to-setup", response_model=MessageResponse)
def revert_to_setup(picklejar_id: str, db: Session = Depends(get_db)):
    """
    Revert PickleJar to the 'setup' phase.
    """
    db_picklejar = db.query(PickleJar).filter(PickleJar.id == picklejar_id).first()

    if not db_picklejar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PickleJar with id {picklejar_id} not found",
        )

    if db_picklejar.status != "suggesting":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot revert to setup from status '{db_picklejar.status}'",
        )

    db_picklejar.status = "setup"
    db_picklejar.updated_at = datetime.utcnow()
    db.commit()

    return MessageResponse(
        message="Reverted to setup phase",
        detail="PickleJar is back in setup mode",
    )


@router.post("/{picklejar_id}/revert-to-suggesting", response_model=MessageResponse)
def revert_to_suggesting(picklejar_id: str, db: Session = Depends(get_db)):
    """
    Revert PickleJar to the 'suggesting' phase.
    """
    db_picklejar = db.query(PickleJar).filter(PickleJar.id == picklejar_id).first()

    if not db_picklejar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PickleJar with id {picklejar_id} not found",
        )

    if db_picklejar.status != "voting":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot revert to suggesting from status '{db_picklejar.status}'",
        )

    db_picklejar.status = "suggesting"
    db_picklejar.updated_at = datetime.utcnow()
    db.commit()

    return MessageResponse(
        message="Reverted to suggesting phase",
        detail="Members can submit suggestions again",
    )


@router.post("/{picklejar_id}/revert-to-voting", response_model=MessageResponse)
def revert_to_voting(picklejar_id: str, db: Session = Depends(get_db)):
    """
    Revert PickleJar to the 'voting' phase.
    """
    db_picklejar = db.query(PickleJar).filter(PickleJar.id == picklejar_id).first()

    if not db_picklejar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PickleJar with id {picklejar_id} not found",
        )

    if db_picklejar.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot revert to voting from status '{db_picklejar.status}'",
        )

    db_picklejar.status = "voting"
    db_picklejar.updated_at = datetime.utcnow()
    db.commit()

    return MessageResponse(
        message="Reverted to voting phase",
        detail="Voting is reopened",
    )


@router.get("/{picklejar_id}/stats", response_model=PickleJarStatsResponse)
def get_picklejar_stats(picklejar_id: str, db: Session = Depends(get_db)):
    """
    Get statistics for a PickleJar.
    """
    db_picklejar = db.query(PickleJar).filter(PickleJar.id == picklejar_id).first()

    if not db_picklejar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PickleJar with id {picklejar_id} not found",
        )

    members = db.query(Member).filter(Member.picklejar_id == picklejar_id).all()
    suggestions = (
        db.query(Suggestion).filter(Suggestion.picklejar_id == picklejar_id).all()
    )

    total_votes = sum(len(suggestion.votes) for suggestion in suggestions)

    return PickleJarStatsResponse(
        picklejar_id=picklejar_id,
        total_members=len(members),
        total_suggestions=len(suggestions),
        members_suggested=sum(1 for m in members if m.has_suggested),
        members_voted=sum(1 for m in members if m.has_voted),
        total_votes_cast=total_votes,
        status=db_picklejar.status,
    )


@router.get("/{picklejar_id}/results", response_model=ResultsResponse)
def get_results(picklejar_id: str, db: Session = Depends(get_db)):
    """
    Get final results for a completed PickleJar.
    Only available after voting is complete.
    """
    db_picklejar = db.query(PickleJar).filter(PickleJar.id == picklejar_id).first()

    if not db_picklejar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PickleJar with id {picklejar_id} not found",
        )

    if db_picklejar.status not in ["completed", "voting"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Results are only available during or after voting phase",
        )

    # Get all suggestions with their votes
    suggestions = (
        db.query(Suggestion).filter(Suggestion.picklejar_id == picklejar_id).all()
    )

    suggestions_with_votes = []
    for suggestion in suggestions:
        total_points = sum(vote.points for vote in suggestion.votes)
        suggestions_with_votes.append(
            {
                "suggestion": suggestion,
                "total_points": total_points,
                "vote_count": len(suggestion.votes),
            }
        )

    # Sort by points (descending)
    suggestions_with_votes.sort(key=lambda x: x["total_points"], reverse=True)

    # Get winner
    winner = None
    if suggestions_with_votes:
        top_suggestion = suggestions_with_votes[0]
        winner = WinnerResponse(
            suggestion=SuggestionWithVotesResponse(
                id=top_suggestion["suggestion"].id,
                picklejar_id=top_suggestion["suggestion"].picklejar_id,
                title=top_suggestion["suggestion"].title,
                description=top_suggestion["suggestion"].description,
                location=top_suggestion["suggestion"].location,
                estimated_cost=top_suggestion["suggestion"].estimated_cost,
                is_active=top_suggestion["suggestion"].is_active,
                created_at=top_suggestion["suggestion"].created_at,
                total_points=top_suggestion["total_points"],
                member_id=top_suggestion["suggestion"].member_id,
                member_phone=top_suggestion["suggestion"].member.phone_number
                if db_picklejar.status == "completed"
                else None,
            ),
            total_points=top_suggestion["total_points"],
            vote_count=top_suggestion["vote_count"],
        )

    # Get all suggestions
    all_suggestions = [
        SuggestionWithVotesResponse(
            id=s["suggestion"].id,
            picklejar_id=s["suggestion"].picklejar_id,
            title=s["suggestion"].title,
            description=s["suggestion"].description,
            location=s["suggestion"].location,
            estimated_cost=s["suggestion"].estimated_cost,
            is_active=s["suggestion"].is_active,
            created_at=s["suggestion"].created_at,
            total_points=s["total_points"],
            member_id=s["suggestion"].member_id,
            member_phone=s["suggestion"].member.phone_number
            if db_picklejar.status == "completed"
            else None,
        )
        for s in suggestions_with_votes
    ]

    # Get stats
    members = db.query(Member).filter(Member.picklejar_id == picklejar_id).all()
    total_votes = sum(s["vote_count"] for s in suggestions_with_votes)

    stats = PickleJarStatsResponse(
        picklejar_id=picklejar_id,
        total_members=len(members),
        total_suggestions=len(suggestions),
        members_suggested=sum(1 for m in members if m.has_suggested),
        members_voted=sum(1 for m in members if m.has_voted),
        total_votes_cast=total_votes,
        status=db_picklejar.status,
    )

    return ResultsResponse(
        picklejar=db_picklejar,
        winner=winner,
        all_suggestions=all_suggestions,
        stats=stats,
    )


@router.delete("/{picklejar_id}", response_model=MessageResponse)
def delete_picklejar(picklejar_id: str, db: Session = Depends(get_db)):
    """
    Delete a PickleJar (soft delete by setting is_active to False).
    """
    db_picklejar = db.query(PickleJar).filter(PickleJar.id == picklejar_id).first()

    if not db_picklejar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PickleJar with id {picklejar_id} not found",
        )

    db_picklejar.is_active = False
    db_picklejar.status = "cancelled"
    db_picklejar.updated_at = datetime.utcnow()
    db.commit()

    return MessageResponse(
        message="PickleJar deleted successfully",
        detail=f"PickleJar '{db_picklejar.title}' has been cancelled",
    )
