from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum as SQLAlchemyEnum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.sql.sqltypes import TIMESTAMP
import enum
from datetime import datetime, timedelta

from app.db.session import Base


class PaymentMethodEnum(str, enum.Enum):
    CASH = "cash"
    CARD = "card"


class Reservation(Base):
    __tablename__ = "reservations"
    
    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    # Store datetime without timezone to avoid conversion issues
    reservation_time = Column(DateTime(timezone=False), nullable=False)
    duration = Column(Float, nullable=False, default=1.0)  # in hours
    guest_name = Column(String, nullable=True)
    payment_method = Column(SQLAlchemyEnum(PaymentMethodEnum, native_enum=False), nullable=False)
    estimated_price = Column(Float, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), onupdate=func.now())
    
    # Relationships
    club = relationship("Club", back_populates="reservations")
    user = relationship("User", back_populates="reservations")
    
    @property
    def end_time(self):
        """Calculate the end time based on reservation time and duration"""
        return self.reservation_time + timedelta(hours=self.duration)
    
    @property
    def is_past(self):
        """Check if the reservation is in the past"""
        # Ensure comparison is done with both naive datetimes
        now = datetime.now()
        end = self.end_time
        # If end time has timezone but now doesn't, make now timezone-aware
        if end.tzinfo is not None and now.tzinfo is None:
            end = end.replace(tzinfo=None)
        # If now has timezone but end time doesn't, make end timezone-aware
        elif now.tzinfo is not None and end.tzinfo is None:
            now = now.replace(tzinfo=None)
        return end < now 