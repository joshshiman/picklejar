import uuid
from datetime import datetime

from database import Base
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship


def generate_uuid():
    """Generate a unique ID for resources"""
    return str(uuid.uuid4())


def generate_short_id():
    """Generate a shorter, URL-friendly ID for PickleJars"""
    return str(uuid.uuid4())[:8]


class PickleJar(Base):
    """
    A PickleJar represents a single group decision-making session.
    It contains suggestions and votes from members.
    """

    __tablename__ = "picklejars"

    id = Column(String, primary_key=True, default=generate_short_id)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    # Settings
    points_per_voter = Column(Integer, default=10)
    max_suggestions_per_member = Column(Integer, default=1)

    # Timing
    suggestion_deadline = Column(DateTime, nullable=True)
    voting_deadline = Column(DateTime, nullable=True)
    hangout_datetime = Column(DateTime, nullable=True)

    # Status
    status = Column(
        String, default="setup"
    )  # setup, suggesting, voting, completed, cancelled
    is_active = Column(Boolean, default=True)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Creator info
    creator_phone = Column(String, nullable=False)

    # Relationships
    members = relationship(
        "Member", back_populates="picklejar", cascade="all, delete-orphan"
    )
    suggestions = relationship(
        "Suggestion", back_populates="picklejar", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<PickleJar(id={self.id}, title={self.title}, status={self.status})>"


class Member(Base):
    """
    A Member represents a participant in a PickleJar.
    Members are identified by phone number within a PickleJar.
    """

    __tablename__ = "members"

    id = Column(String, primary_key=True, default=generate_uuid)
    picklejar_id = Column(String, ForeignKey("picklejars.id"), nullable=False)

    # Identity
    phone_number = Column(String, nullable=False)
    display_name = Column(String, nullable=True)  # Optional nickname

    # Verification
    is_verified = Column(Boolean, default=False)
    verification_code = Column(String, nullable=True)

    # Status
    has_suggested = Column(Boolean, default=False)
    has_voted = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

    # Metadata
    joined_at = Column(DateTime, default=datetime.utcnow)
    last_active = Column(DateTime, default=datetime.utcnow)

    # Relationships
    picklejar = relationship("PickleJar", back_populates="members")
    suggestions = relationship(
        "Suggestion", back_populates="member", cascade="all, delete-orphan"
    )
    votes = relationship("Vote", back_populates="member", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Member(id={self.id}, phone={self.phone_number}, jar={self.picklejar_id})>"


class Suggestion(Base):
    """
    A Suggestion is an idea submitted by a member for the group hangout.
    Suggestions are anonymous until voting ends.
    """

    __tablename__ = "suggestions"

    id = Column(String, primary_key=True, default=generate_uuid)
    picklejar_id = Column(String, ForeignKey("picklejars.id"), nullable=False)
    member_id = Column(String, ForeignKey("members.id"), nullable=False)

    # Content
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String, nullable=True)
    estimated_cost = Column(String, nullable=True)  # e.g., "$", "$$", "$$$"

    # Status
    is_active = Column(Boolean, default=True)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    picklejar = relationship("PickleJar", back_populates="suggestions")
    member = relationship("Member", back_populates="suggestions")
    votes = relationship(
        "Vote", back_populates="suggestion", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Suggestion(id={self.id}, title={self.title})>"

    @property
    def total_points(self):
        """Calculate total points received from all votes"""
        return sum(vote.points for vote in self.votes)


class Vote(Base):
    """
    A Vote represents points allocated by a member to a suggestion.
    Members can distribute their points across multiple suggestions.
    """

    __tablename__ = "votes"

    id = Column(String, primary_key=True, default=generate_uuid)
    member_id = Column(String, ForeignKey("members.id"), nullable=False)
    suggestion_id = Column(String, ForeignKey("suggestions.id"), nullable=False)
    picklejar_id = Column(String, ForeignKey("picklejars.id"), nullable=False)

    # Vote content
    points = Column(Integer, nullable=False, default=0)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    member = relationship("Member", back_populates="votes")
    suggestion = relationship("Suggestion", back_populates="votes")

    def __repr__(self):
        return f"<Vote(id={self.id}, points={self.points})>"
