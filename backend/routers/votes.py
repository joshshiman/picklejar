from datetime import datetime
from typing import List, Tuple

from database import get_db
from fastapi import APIRouter, Depends, HTTPException, status
from models import Member, PickleJar, Suggestion, Vote
from schemas import (
    MessageResponse,
    VoteBatchCreate,
    VoteCreate,
    VoteResponse,
    VoteSummaryResponse,
)
from sqlalchemy.orm import Session

router = APIRouter()


def _ensure_points_per_voter_initialized(
    db: Session, picklejar: PickleJar
) -> Tuple[PickleJar, int]:
    """
    Ensure points_per_voter is initialized for this PickleJar.

    If points_per_voter is not explicitly set (<= 0 or None), derive it from the
    current member count as (n - 1), where n is the number of members in this jar.
    A minimum of 1 point per voter is enforced.

    Returns a tuple of (updated_picklejar, effective_points_per_voter).
    """
    # If already set to a positive value, just use it.
    if getattr(picklejar, "points_per_voter", 0) and picklejar.points_per_voter > 0:
        return picklejar, picklejar.points_per_voter

    # Derive from member count: n - 1 (minimum 1)
    member_count = db.query(Member).filter(Member.picklejar_id == picklejar.id).count()
    derived_points = max(member_count - 1, 1)

    picklejar.points_per_voter = derived_points
    picklejar.updated_at = datetime.utcnow()
    db.add(picklejar)
    db.commit()
    db.refresh(picklejar)

    return picklejar, derived_points


@router.post(
    "/{picklejar_id}/vote",
    response_model=VoteSummaryResponse,
    status_code=status.HTTP_201_CREATED,
)
def submit_votes(
    picklejar_id: str,
    member_id: str,
    vote_data: VoteBatchCreate,
    db: Session = Depends(get_db),
):
    """
    Submit votes for a PickleJar.
    Members can allocate their points across multiple suggestions.
    This replaces any existing votes from this member.

    The allowed points per voter are automatically derived if not set:
    - points_per_voter = max(n - 1, 1), where n is the number of members
      in the PickleJar.
    """
    # Check if PickleJar exists and is in voting phase
    db_picklejar = db.query(PickleJar).filter(PickleJar.id == picklejar_id).first()
    if not db_picklejar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PickleJar with id {picklejar_id} not found",
        )

    if db_picklejar.status != "voting":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot vote during '{db_picklejar.status}' phase",
        )

    # Ensure points_per_voter is initialized (n - 1 rule) before validating votes
    db_picklejar, effective_points_per_voter = _ensure_points_per_voter_initialized(
        db, db_picklejar
    )

    # Check if member exists
    db_member = (
        db.query(Member)
        .filter(Member.id == member_id, Member.picklejar_id == picklejar_id)
        .first()
    )

    if not db_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in this PickleJar",
        )

    # Calculate total points being allocated
    total_points = sum(vote.points for vote in vote_data.votes)

    if total_points > effective_points_per_voter:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Total points ({total_points}) exceeds allowed points per voter "
                f"({effective_points_per_voter})"
            ),
        )

    # Verify all suggestions exist and belong to this PickleJar
    suggestion_ids = [vote.suggestion_id for vote in vote_data.votes]
    suggestions = (
        db.query(Suggestion)
        .filter(
            Suggestion.id.in_(suggestion_ids),
            Suggestion.picklejar_id == picklejar_id,
            Suggestion.is_active == True,
        )
        .all()
    )

    if len(suggestions) != len(suggestion_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more suggestions not found or inactive",
        )

    # Delete existing votes from this member for this PickleJar
    db.query(Vote).filter(
        Vote.member_id == member_id, Vote.picklejar_id == picklejar_id
    ).delete()

    # Create new votes
    new_votes = []
    for vote in vote_data.votes:
        if vote.points > 0:  # Only create votes with positive points
            db_vote = Vote(
                member_id=member_id,
                suggestion_id=vote.suggestion_id,
                picklejar_id=picklejar_id,
                points=vote.points,
            )
            db.add(db_vote)
            new_votes.append(db_vote)

    # Update member status
    db_member.has_voted = True
    db_member.last_active = datetime.utcnow()

    db.commit()

    # Refresh votes to get IDs
    for vote in new_votes:
        db.refresh(vote)

    # Return summary
    return VoteSummaryResponse(
        total_points_allocated=total_points,
        remaining_points=db_picklejar.points_per_voter - total_points,
        votes=[
            VoteResponse(
                id=vote.id,
                member_id=vote.member_id,
                suggestion_id=vote.suggestion_id,
                picklejar_id=vote.picklejar_id,
                points=vote.points,
                created_at=vote.created_at,
            )
            for vote in new_votes
        ],
    )


@router.get("/{picklejar_id}/votes/{member_id}", response_model=VoteSummaryResponse)
def get_member_votes(picklejar_id: str, member_id: str, db: Session = Depends(get_db)):
    """
    Get a member's votes for a PickleJar.
    Only the member themselves can view their votes.

    Ensures points_per_voter is initialized using the same n - 1 rule used
    during vote submission, so remaining_points is consistent.
    """
    # Check if PickleJar exists
    db_picklejar = db.query(PickleJar).filter(PickleJar.id == picklejar_id).first()
    if not db_picklejar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PickleJar with id {picklejar_id} not found",
        )

    # Ensure points_per_voter is initialized so remaining_points is meaningful
    db_picklejar, _ = _ensure_points_per_voter_initialized(db, db_picklejar)

    # Check if member exists
    db_member = (
        db.query(Member)
        .filter(Member.id == member_id, Member.picklejar_id == picklejar_id)
        .first()
    )

    if not db_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in this PickleJar",
        )

    # Get votes
    votes = (
        db.query(Vote)
        .filter(Vote.member_id == member_id, Vote.picklejar_id == picklejar_id)
        .all()
    )

    total_points = sum(vote.points for vote in votes)

    return VoteSummaryResponse(
        total_points_allocated=total_points,
        remaining_points=db_picklejar.points_per_voter - total_points,
        votes=[
            VoteResponse(
                id=vote.id,
                member_id=vote.member_id,
                suggestion_id=vote.suggestion_id,
                picklejar_id=vote.picklejar_id,
                points=vote.points,
                created_at=vote.created_at,
            )
            for vote in votes
        ],
    )


@router.delete("/{picklejar_id}/votes/{member_id}", response_model=MessageResponse)
def clear_votes(picklejar_id: str, member_id: str, db: Session = Depends(get_db)):
    """
    Clear all votes for a member in a PickleJar.
    Allows members to start over with their vote allocation.
    """
    # Check if PickleJar exists and is in voting phase
    db_picklejar = db.query(PickleJar).filter(PickleJar.id == picklejar_id).first()
    if not db_picklejar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PickleJar with id {picklejar_id} not found",
        )

    if db_picklejar.status != "voting":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot clear votes outside of voting phase",
        )

    # Check if member exists
    db_member = (
        db.query(Member)
        .filter(Member.id == member_id, Member.picklejar_id == picklejar_id)
        .first()
    )

    if not db_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in this PickleJar",
        )

    # Delete all votes
    deleted_count = (
        db.query(Vote)
        .filter(Vote.member_id == member_id, Vote.picklejar_id == picklejar_id)
        .delete()
    )

    # Update member status
    db_member.has_voted = False
    db_member.last_active = datetime.utcnow()

    db.commit()

    return MessageResponse(
        message="Votes cleared successfully",
        detail=f"Removed {deleted_count} vote(s)",
    )


@router.get("/{picklejar_id}/suggestion/{suggestion_id}/votes")
def get_suggestion_votes(
    picklejar_id: str, suggestion_id: str, db: Session = Depends(get_db)
):
    """
    Get vote statistics for a specific suggestion.
    Only available after voting is complete.
    """
    # Check if PickleJar exists
    db_picklejar = db.query(PickleJar).filter(PickleJar.id == picklejar_id).first()
    if not db_picklejar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PickleJar with id {picklejar_id} not found",
        )

    # Only allow viewing results after voting phase
    if db_picklejar.status not in ["completed", "voting"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vote details only available during or after voting phase",
        )

    # Check if suggestion exists
    db_suggestion = (
        db.query(Suggestion)
        .filter(Suggestion.id == suggestion_id, Suggestion.is_active == True)
        .first()
    )

    if not db_suggestion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Suggestion with id {suggestion_id} not found",
        )

    # Get all votes for this suggestion
    votes = db.query(Vote).filter(Vote.suggestion_id == suggestion_id).all()

    total_points = sum(vote.points for vote in votes)
    vote_count = len(votes)

    return {
        "suggestion_id": suggestion_id,
        "total_points": total_points,
        "vote_count": vote_count,
        "votes": [
            {
                "points": vote.points,
                "created_at": vote.created_at,
                # Don't reveal member identity
            }
            for vote in votes
        ],
    }
