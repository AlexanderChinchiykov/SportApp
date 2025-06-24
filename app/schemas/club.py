from pydantic import BaseModel, Field, HttpUrl, field_validator
from datetime import datetime
from typing import Optional, List, Dict, Any, Union

class ClubBase(BaseModel):
    name: str
    town: str
    telephone: str
    hourly_price: float = Field(..., gt=0)
    description: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    social_media: Optional[Dict[str, str]] = None

class ClubCreate(ClubBase):
    pass

class ClubUpdate(BaseModel):
    name: Optional[str] = None
    town: Optional[str] = None
    telephone: Optional[str] = None
    hourly_price: Optional[float] = Field(None, gt=0)
    description: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    social_media: Optional[Dict[str, str]] = None

class PictureUpload(BaseModel):
    picture_url: str

class ClubResponse(ClubBase):
    id: int
    owner_id: int
    pictures: List[str] = []
    created_at: datetime
    
    class Config:
        from_attributes = True
    
    @field_validator('pictures', mode='before')
    @classmethod
    def validate_pictures(cls, v):
        if v is None:
            return []
        
        if isinstance(v, str):
            try:
                import json
                return json.loads(v)
            except json.JSONDecodeError:
                return []
        
        return v

class ClubDetailResponse(ClubResponse):
    average_rating: float = 0.0
    reviews_count: int = 0
    comments_count: int = 0
    owner_name: Optional[str] = None 