from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ReviewBase(BaseModel):
    rating: float = Field(..., ge=1, le=5)  # Rating from 1 to 5
    comment: Optional[str] = None

class ReviewCreate(ReviewBase):
    club_id: int

class ReviewResponse(ReviewBase):
    id: int
    club_id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ReviewWithUser(ReviewResponse):
    user_name: str
    user_role: str
    
    class Config:
        from_attributes = True

class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    club_id: int
    parent_id: Optional[int] = None

class CommentResponse(CommentBase):
    id: int
    club_id: int
    user_id: int
    parent_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class CommentWithUser(CommentResponse):
    user_name: str
    user_role: str
    
    class Config:
        from_attributes = True

class CommentWithReplies(CommentWithUser):
    replies: List['CommentWithUser'] = []
    
    class Config:
        from_attributes = True 