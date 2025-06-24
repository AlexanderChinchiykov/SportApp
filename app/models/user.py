from sqlalchemy import Column, Integer, String, Boolean, Enum, ForeignKey, Enum as SQLAlchemyEnum, DateTime, JSON, Table
from sqlalchemy.sql import func
from sqlalchemy.sql.sqltypes import TIMESTAMP
from sqlalchemy.orm import relationship
import enum

from app.db.session import Base

class UserRoleEnum(enum.Enum):
    ADMIN = "admin"
    STUDENT = "student"
    CLUB_OWNER = "club_owner"
    COACH = "coach"

class UserBadgeEnum(enum.Enum):
    REVIEWER = "reviewer"
    COMMENTER = "commenter"
    ACTIVE_MEMBER = "active_member"
    TOP_CONTRIBUTOR = "top_contributor"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String)
    last_name = Column(String)
    role = Column(SQLAlchemyEnum(UserRoleEnum), default=UserRoleEnum.STUDENT)
    is_active = Column(Boolean, default=True)
    is_club_owner = Column(Boolean, default=False)
    member_of_club_id = Column(Integer, ForeignKey("clubs.id"), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), onupdate=func.now())
    
    # Badge tracking
    badges = Column(JSON, default=list)
    
    # Relationships
    owned_clubs = relationship("Club", back_populates="owner", foreign_keys="Club.owner_id")
    member_of_club = relationship("Club", back_populates="members", foreign_keys=[member_of_club_id])
    reviews = relationship("Review", back_populates="user")
    comments = relationship("Comment", back_populates="user")
    reservations = relationship("Reservation", back_populates="user")
    
    def add_badge(self, badge: UserBadgeEnum):
        """Add a badge to the user's collection if they don't already have it"""
        if not self.badges:
            self.badges = []
            
        badge_value = badge.value
        if badge_value not in self.badges:
            self.badges.append(badge_value)
            
    def has_badge(self, badge: UserBadgeEnum) -> bool:
        """Check if user has a specific badge"""
        if not self.badges:
            return False
        return badge.value in self.badges 