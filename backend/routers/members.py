from datetime import datetime
from typing import List

from database import get_db
from fastapi import APIRouter, Depends, HTTPException, status
from models import Member, PickleJar
from schemas import (
    MemberCreate,
    MemberResponse,
    MemberStatusResponse,
    MessageResponse,
)
from sqlalchemy.orm import Session

router = APIRouter()


@router.post(
    "/{picklejar_id}/join",
    response_model=MemberResponse,
    status_code=status.HTTP_201_CREATED,
)
def join_picklejar(
    picklejar_id: str, member_data: MemberCreate, db: Session = Depends(get_db)
):
    """
    Join a PickleJar as a member.
    If already joined with this phone number, returns existing member.
    """
    # Check if PickleJar exists
    db_picklejar = db.query(PickleJar).filter(PickleJar.id == picklejar_id).first()
    if not db_picklejar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PickleJar with id {picklejar_id} not found",
        )

    if not db_picklejar.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This PickleJar is no longer active",
        )

    # Check if member already exists
    existing_member = (
        db.query(Member)
        .filter(
            Member.picklejar_id == picklejar_id,
            Member.phone_number == member_data.phone_number,
        )
        .first()
    )

    if existing_member:
        # Update last active time
        existing_member.last_active = datetime.utcnow()
        if member_data.display_name:
            existing_member.display_name = member_data.display_name
        db.commit()
        db.refresh(existing_member)
        return existing_member

    # Create new member
    db_member = Member(
        picklejar_id=picklejar_id,
        phone_number=member_data.phone_number,
        display_name=member_data.display_name,
    )

    db.add(db_member)
    db.commit()
    db.refresh(db_member)

    return db_member


@router.get("/{picklejar_id}/members", response_model=List[MemberStatusResponse])
def get_picklejar_members(picklejar_id: str, db: Session = Depends(get_db)):
    """
    Get all members in a PickleJar (anonymized view).
    Shows participation status but not personal details.
    """
    # Check if PickleJar exists
    db_picklejar = db.query(PickleJar).filter(PickleJar.id == picklejar_id).first()
    if not db_picklejar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PickleJar with id {picklejar_id} not found",
        )

    members = (
        db.query(Member)
        .filter(Member.picklejar_id == picklejar_id, Member.is_active == True)
        .all()
    )

    return [
        MemberStatusResponse(
            display_name=member.display_name or "Anonymous",
            has_suggested=member.has_suggested,
            has_voted=member.has_voted,
            joined_at=member.joined_at,
        )
        for member in members
    ]


@router.get("/member/{member_id}", response_model=MemberResponse)
def get_member(member_id: str, db: Session = Depends(get_db)):
    """
    Get a specific member by ID.
    """
    db_member = db.query(Member).filter(Member.id == member_id).first()

    if not db_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member with id {member_id} not found",
        )

    return db_member


@router.get(
    "/{picklejar_id}/member-by-phone/{phone_number}", response_model=MemberResponse
)
def get_member_by_phone(
    picklejar_id: str, phone_number: str, db: Session = Depends(get_db)
):
    """
    Get a member by phone number within a specific PickleJar.
    Useful for session management.
    """
    # Clean phone number
    cleaned_phone = "".join(c for c in phone_number if c.isdigit() or c == "+")

    db_member = (
        db.query(Member)
        .filter(
            Member.picklejar_id == picklejar_id,
            Member.phone_number == cleaned_phone,
            Member.is_active == True,
        )
        .first()
    )

    if not db_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member with phone {phone_number} not found in this PickleJar",
        )

    # Update last active
    db_member.last_active = datetime.utcnow()
    db.commit()

    return db_member


@router.patch("/member/{member_id}/display-name", response_model=MemberResponse)
def update_display_name(
    member_id: str, display_name: str, db: Session = Depends(get_db)
):
    """
    Update a member's display name.
    """
    db_member = db.query(Member).filter(Member.id == member_id).first()

    if not db_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member with id {member_id} not found",
        )

    db_member.display_name = display_name
    db_member.last_active = datetime.utcnow()
    db.commit()
    db.refresh(db_member)

    return db_member


@router.delete("/member/{member_id}", response_model=MessageResponse)
def leave_picklejar(member_id: str, db: Session = Depends(get_db)):
    """
    Leave a PickleJar (soft delete).
    """
    db_member = db.query(Member).filter(Member.id == member_id).first()

    if not db_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member with id {member_id} not found",
        )

    db_member.is_active = False
    db.commit()

    return MessageResponse(
        message="Successfully left PickleJar",
        detail=f"You have been removed from the group",
    )
