from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, validator

# ============================================================================
# PickleJar Schemas
# ============================================================================


class PickleJarCreate(BaseModel):
    """Schema for creating a new PickleJar.

    Note:
        - `points_per_voter` is treated as an internal field and should not be
          exposed as a user-configurable option in the UI. The application
          code may derive this value automatically (for example, based on the
          number of participants).
        - `creator_phone` is optional in the current minimal flow and may be
          omitted by clients that do not yet collect phone numbers at creation
          time.
    """

    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    points_per_voter: int = Field(10, ge=1, le=100)
    max_suggestions_per_member: int = Field(1, ge=1, le=10)
    suggestion_deadline: Optional[datetime] = None
    voting_deadline: Optional[datetime] = None
    hangout_datetime: Optional[datetime] = None
    creator_phone: Optional[str] = Field(None, min_length=10, max_length=20)


class PickleJarUpdate(BaseModel):
    """Schema for updating a PickleJar"""

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    status: Optional[str] = Field(
        None, pattern="^(setup|suggesting|voting|completed|cancelled)$"
    )
    hangout_datetime: Optional[datetime] = None


class PickleJarResponse(BaseModel):
    """Schema for PickleJar responses"""

    id: str
    title: str
    description: Optional[str]
    points_per_voter: int
    max_suggestions_per_member: int
    suggestion_deadline: Optional[datetime]
    voting_deadline: Optional[datetime]
    hangout_datetime: Optional[datetime]
    status: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    creator_phone: Optional[str]

    class Config:
        from_attributes = True


class PickleJarDetailResponse(PickleJarResponse):
    """Schema for detailed PickleJar response with members and suggestions count"""

    member_count: int = 0
    suggestion_count: int = 0
    members_who_suggested: int = 0
    members_who_voted: int = 0


# ============================================================================
# Member Schemas
# ============================================================================


class MemberCreate(BaseModel):
    """Schema for joining a PickleJar as a member"""

    phone_number: str = Field(..., min_length=10, max_length=20)
    display_name: Optional[str] = Field(None, max_length=100)

    @validator("phone_number")
    def validate_phone(cls, v):
        # Remove common formatting characters
        cleaned = "".join(c for c in v if c.isdigit() or c == "+")
        if len(cleaned) < 10:
            raise ValueError("Phone number must be at least 10 digits")
        return cleaned


class MemberResponse(BaseModel):
    """Schema for Member responses"""

    id: str
    picklejar_id: str
    phone_number: str
    display_name: Optional[str]
    is_verified: bool
    has_suggested: bool
    has_voted: bool
    is_active: bool
    joined_at: datetime

    class Config:
        from_attributes = True


class MemberStatusResponse(BaseModel):
    """Schema for member status in a PickleJar (anonymized for other members)"""

    display_name: Optional[str]
    has_suggested: bool
    has_voted: bool
    joined_at: datetime


# ============================================================================
# Suggestion Schemas
# ============================================================================


class SuggestionCreate(BaseModel):
    """Schema for creating a suggestion"""

    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    location: Optional[str] = Field(None, max_length=200)
    estimated_cost: Optional[str] = Field(
        None, pattern="^(\\$|\\$\\$|\\$\\$\\$|\\$\\$\\$\\$|Free)$"
    )


class SuggestionUpdate(BaseModel):
    """Schema for updating a suggestion"""

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    location: Optional[str] = Field(None, max_length=200)
    estimated_cost: Optional[str] = Field(
        None, pattern="^(\\$|\\$\\$|\\$\\$\\$|\\$\\$\\$\\$|Free)$"
    )


class SuggestionResponse(BaseModel):
    """Schema for Suggestion responses (anonymous during voting)"""

    id: str
    picklejar_id: str
    title: str
    description: Optional[str]
    location: Optional[str]
    estimated_cost: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class SuggestionWithVotesResponse(SuggestionResponse):
    """Schema for Suggestion with vote count (after voting ends)"""

    total_points: int
    member_id: str
    member_phone: Optional[str] = None  # Revealed after voting


# ============================================================================
# Vote Schemas
# ============================================================================


class VoteCreate(BaseModel):
    """Schema for creating/updating votes"""

    suggestion_id: str
    points: int = Field(..., ge=0)


class VoteBatchCreate(BaseModel):
    """Schema for submitting all votes at once"""

    votes: List[VoteCreate]

    @validator("votes")
    def validate_votes(cls, v):
        if not v:
            raise ValueError("Must provide at least one vote")
        # Check for duplicate suggestions
        suggestion_ids = [vote.suggestion_id for vote in v]
        if len(suggestion_ids) != len(set(suggestion_ids)):
            raise ValueError("Cannot vote on the same suggestion twice")
        return v


class VoteResponse(BaseModel):
    """Schema for Vote responses"""

    id: str
    member_id: str
    suggestion_id: str
    picklejar_id: str
    points: int
    created_at: datetime

    class Config:
        from_attributes = True


class VoteSummaryResponse(BaseModel):
    """Schema for vote summary for a member"""

    total_points_allocated: int
    remaining_points: int
    votes: List[VoteResponse]


# ============================================================================
# Statistics & Results Schemas
# ============================================================================


class PickleJarStatsResponse(BaseModel):
    """Schema for PickleJar statistics"""

    picklejar_id: str
    total_members: int
    total_suggestions: int
    members_suggested: int
    members_voted: int
    total_votes_cast: int
    status: str


class WinnerResponse(BaseModel):
    """Schema for announcing the winning suggestion"""

    suggestion: SuggestionWithVotesResponse
    total_points: int
    vote_count: int


class ResultsResponse(BaseModel):
    """Schema for final results"""

    picklejar: PickleJarResponse
    winner: Optional[WinnerResponse]
    all_suggestions: List[SuggestionWithVotesResponse]
    stats: PickleJarStatsResponse


# ============================================================================
# Utility Schemas
# ============================================================================


class MessageResponse(BaseModel):
    """Generic message response"""

    message: str
    detail: Optional[str] = None


class ErrorResponse(BaseModel):
    """Error response schema"""

    error: str
    detail: Optional[str] = None
    status_code: int
