from pydantic import BaseModel, validator, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, date as date_type
import pytz
from enum import Enum

# These schema models should match the FastAPI endpoint request/response models

class PaymentMethodEnum(str, Enum):
    CASH = "cash"
    CARD = "card"

class ReservationBase(BaseModel):
    club_id: int
    reservation_time: Union[datetime, str]  # Accept either datetime or string (HH:MM)
    duration: float = Field(1.0, gt=0)
    payment_method: PaymentMethodEnum
    date: Optional[str] = None  # Optional date field for string time formats
    
    @validator('reservation_time')
    def validate_reservation_time(cls, value):
        # Don't convert strings here, just validate datetime objects
        if isinstance(value, datetime):
            # Ensure datetime is timezone-aware
            if value.tzinfo is None:
                value = value.replace(tzinfo=pytz.UTC)
        elif not isinstance(value, str):
            raise ValueError("Reservation time must be a datetime object or a time string (HH:MM)")
            
        return value

class ReservationCreate(ReservationBase):
    guest_name: Optional[str] = None
    
    @validator('guest_name')
    def validate_guest_name(cls, value, values, **kwargs):
        # guest_name is required if no current user (will be checked in the endpoint)
        return value
    
    class Config:
        # Allow extra fields for flexibility
        extra = "allow"

class ReservationResponse(BaseModel):
    id: int
    club_id: int
    user_id: Optional[int] = None
    reservation_time: datetime
    duration: float
    guest_name: Optional[str] = None
    payment_method: PaymentMethodEnum
    estimated_price: float
    created_at: datetime
    
    class Config:
        orm_mode = True

class TimeSlot(BaseModel):
    start_time: str
    is_available: bool

class AvailableSlotsResponse(BaseModel):
    date: str
    slots: List[TimeSlot] 