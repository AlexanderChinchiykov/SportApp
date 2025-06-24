from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.sql.sqltypes import TIMESTAMP
from typing import List, Optional
import json

from app.db.session import Base

class Club(Base):
    __tablename__ = "clubs"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    town = Column(String, nullable=False)
    telephone = Column(String, nullable=False)
    hourly_price = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    address = Column(String, nullable=True)
    website = Column(String, nullable=True)
    social_media = Column(JSON, nullable=True)
    pictures = Column(JSON, nullable=True, default="[]")
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="owned_clubs", foreign_keys=[owner_id])
    members = relationship("User", back_populates="member_of_club", foreign_keys="User.member_of_club_id")
    reviews = relationship("Review", back_populates="club")
    comments = relationship("Comment", back_populates="club")
    reservations = relationship("Reservation", back_populates="club")
    
    def add_picture(self, picture_url: str) -> None:
        """Add a picture URL to the club's pictures list."""
        current_pictures = self.get_pictures()
        current_pictures.append(picture_url)
        self.pictures = json.dumps(current_pictures)
    
    def remove_picture(self, picture_url: str) -> bool:
        """Remove a picture URL from the club's pictures list."""
        current_pictures = self.get_pictures()
        if picture_url in current_pictures:
            current_pictures.remove(picture_url)
            self.pictures = json.dumps(current_pictures)
            return True
        return False
    
    def get_pictures(self) -> List[str]:
        """Get the list of picture URLs."""
        if not self.pictures:
            return []
        
        if isinstance(self.pictures, list):
            return self.pictures
            
        try:
            return json.loads(self.pictures)
        except (TypeError, json.JSONDecodeError):
            return [] 