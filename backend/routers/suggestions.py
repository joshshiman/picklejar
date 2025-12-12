from datetime import datetime
from typing import List

from config import settings
from database import get_db
from fastapi import APIRouter, Depends, HTTPException, status
from models import Member, PickleJar, Suggestion
from schemas import (
    MessageResponse,
    SuggestionCreate,
    SuggestionResponse,
    SuggestionUpdate,
)
from sqlalchemy.orm import Session

router = APIRouter()

STRUCTURED_LOCATION_FIELDS = [
    "structured_location",
    "latitude",
    "longitude",
    "map_bounds",
    "geo_source",
    "location_confidence",
    "location_last_verified_at",
]


def _build_structured_location_kwargs(suggestion_data: SuggestionCreate) -> dict:
    has_structured_input = any(
        getattr(suggestion_data, field) is not None
        for field in STRUCTURED_LOCATION_FIELDS
    )
    if not has_structured_input:
        return {}
    if not settings.ENABLE_STRUCTURED_LOCATION:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Structured location is currently disabled.",
        )
    latitude = suggestion_data.latitude
    longitude = suggestion_data.longitude
    if (latitude is None) ^ (longitude is None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Latitude and longitude must be provided together.",
        )
    requires_coordinates = any(
        field not in {"latitude", "longitude"}
        and getattr(suggestion_data, field) is not None
        for field in STRUCTURED_LOCATION_FIELDS
    )
    if requires_coordinates and (latitude is None or longitude is None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Structured location submissions require latitude and longitude.",
        )
    return {
        field: getattr(suggestion_data, field)
        for field in STRUCTURED_LOCATION_FIELDS
        if getattr(suggestion_data, field) is not None
    }


def _extract_structured_location_updates(update_data: dict) -> dict:
    provided = {
        field: update_data[field]
        for field in STRUCTURED_LOCATION_FIELDS
        if field in update_data
    }
    if not provided:
        return {}
    if not settings.ENABLE_STRUCTURED_LOCATION:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Structured location is currently disabled.",
        )
    latitude_in_payload = "latitude" in provided
    longitude_in_payload = "longitude" in provided
    if latitude_in_payload ^ longitude_in_payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Latitude and longitude must be provided together.",
        )
    non_coordinate_fields_present = any(
        field not in {"latitude", "longitude"} and provided.get(field) is not None
        for field in STRUCTURED_LOCATION_FIELDS
        if field in provided
    )
    if non_coordinate_fields_present and (
        provided.get("latitude") is None or provided.get("longitude") is None
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Structured location submissions require latitude and longitude.",
        )
    return provided


@router.post(
    "/{picklejar_id}/suggest",
    response_model=SuggestionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_suggestion(
    picklejar_id: str,
    member_id: str,
    suggestion_data: SuggestionCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new suggestion for a PickleJar.
    Requires member_id as query parameter for authentication.
    """
    # Check if PickleJar exists and is in correct phase
    db_picklejar = db.query(PickleJar).filter(PickleJar.id == picklejar_id).first()
    if not db_picklejar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PickleJar with id {picklejar_id} not found",
        )

    if db_picklejar.status not in ["setup", "suggesting"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot submit suggestions during '{db_picklejar.status}' phase",
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

    # Check if member has reached max suggestions
    existing_suggestions_count = (
        db.query(Suggestion)
        .filter(
            Suggestion.picklejar_id == picklejar_id,
            Suggestion.member_id == member_id,
            Suggestion.is_active == True,
        )
        .count()
    )

    if existing_suggestions_count >= db_picklejar.max_suggestions_per_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {db_picklejar.max_suggestions_per_member} suggestion(s) per member reached",
        )

    # Create suggestion
    structured_fields = _build_structured_location_kwargs(suggestion_data)

    db_suggestion = Suggestion(
        picklejar_id=picklejar_id,
        member_id=member_id,
        title=suggestion_data.title,
        description=suggestion_data.description,
        location=suggestion_data.location,
        estimated_cost=suggestion_data.estimated_cost,
        **structured_fields,
    )

    db.add(db_suggestion)

    # Update member status
    db_member.has_suggested = True
    db_member.last_active = datetime.utcnow()

    db.commit()
    db.refresh(db_suggestion)

    return db_suggestion


@router.get("/{picklejar_id}/suggestions", response_model=List[SuggestionResponse])
def get_suggestions(picklejar_id: str, db: Session = Depends(get_db)):
    """
    Get all suggestions for a PickleJar.
    Suggestions are anonymous until voting is complete.
    """
    # Check if PickleJar exists
    db_picklejar = db.query(PickleJar).filter(PickleJar.id == picklejar_id).first()
    if not db_picklejar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PickleJar with id {picklejar_id} not found",
        )

    # Get all active suggestions
    suggestions = (
        db.query(Suggestion)
        .filter(Suggestion.picklejar_id == picklejar_id, Suggestion.is_active == True)
        .all()
    )

    return suggestions


@router.get("/suggestion/{suggestion_id}", response_model=SuggestionResponse)
def get_suggestion(suggestion_id: str, db: Session = Depends(get_db)):
    """
    Get a specific suggestion by ID.
    """
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

    return db_suggestion


@router.patch("/suggestion/{suggestion_id}", response_model=SuggestionResponse)
def update_suggestion(
    suggestion_id: str,
    member_id: str,
    suggestion_data: SuggestionUpdate,
    db: Session = Depends(get_db),
):
    """
    Update a suggestion.
    Only the member who created it can update it, and only during suggesting phase.
    """
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

    # Check if member owns this suggestion
    if db_suggestion.member_id != member_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own suggestions",
        )

    # Check if PickleJar is still in suggesting phase
    db_picklejar = (
        db.query(PickleJar).filter(PickleJar.id == db_suggestion.picklejar_id).first()
    )

    if db_picklejar.status not in ["setup", "suggesting"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot edit suggestions after suggesting phase ends",
        )

    # Update fields if provided
    update_data = suggestion_data.model_dump(exclude_unset=True)
    structured_updates = _extract_structured_location_updates(update_data)
    for structured_field, structured_value in structured_updates.items():
        setattr(db_suggestion, structured_field, structured_value)
        update_data.pop(structured_field, None)

    for field, value in update_data.items():
        setattr(db_suggestion, field, value)

    db_suggestion.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_suggestion)

    return db_suggestion


@router.delete("/suggestion/{suggestion_id}", response_model=MessageResponse)
def delete_suggestion(
    suggestion_id: str, member_id: str, db: Session = Depends(get_db)
):
    """
    Delete a suggestion (soft delete).
    Only the member who created it can delete it, and only during suggesting phase.
    """
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

    # Check if member owns this suggestion
    if db_suggestion.member_id != member_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own suggestions",
        )

    # Check if PickleJar is still in suggesting phase
    db_picklejar = (
        db.query(PickleJar).filter(PickleJar.id == db_suggestion.picklejar_id).first()
    )

    if db_picklejar.status not in ["setup", "suggesting"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete suggestions after suggesting phase ends",
        )

    # Soft delete
    db_suggestion.is_active = False
    db.commit()

    # Check if member has any other active suggestions
    remaining_suggestions = (
        db.query(Suggestion)
        .filter(
            Suggestion.member_id == member_id,
            Suggestion.picklejar_id == db_suggestion.picklejar_id,
            Suggestion.is_active == True,
        )
        .count()
    )

    if remaining_suggestions == 0:
        # Update member status
        db_member = db.query(Member).filter(Member.id == member_id).first()
        if db_member:
            db_member.has_suggested = False
            db.commit()

    return MessageResponse(
        message="Suggestion deleted successfully",
        detail="Your suggestion has been removed",
    )
