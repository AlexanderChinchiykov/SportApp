from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.api.dependencies import get_db, get_current_user
from app.models import User, Club
from app.schemas import ReviewCreate, ReviewResponse, ReviewWithUser, CommentCreate, CommentResponse, CommentWithUser, CommentWithReplies
from app.services import (
    create_review_service, 
    get_club_reviews_service, 
    get_club_average_rating_service,
    create_comment_service,
    get_club_comments_service,
    get_club_by_id
)

router = APIRouter()

@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    review: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new review for a club"""
    # Check if the club exists
    club = get_club_by_id(db, review.club_id)
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Club with id {review.club_id} not found"
        )
    
    # Check if the user is not the owner of the club
    if club.owner_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Club owners cannot review their own clubs"
        )
    
    return create_review_service(db=db, review=review, user_id=current_user.id)

@router.get("/club/{club_id}", response_model=List[Dict[str, Any]])
def get_club_reviews(
    club_id: int,
    db: Session = Depends(get_db)
):
    """Get all reviews for a specific club"""
    # Check if the club exists
    club = get_club_by_id(db, club_id)
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Club with id {club_id} not found"
        )
    
    return get_club_reviews_service(db=db, club_id=club_id)

@router.get("/club/{club_id}/rating")
def get_club_average_rating(
    club_id: int,
    db: Session = Depends(get_db)
):
    """Get the average rating for a club"""
    # Check if the club exists
    club = get_club_by_id(db, club_id)
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Club with id {club_id} not found"
        )
    
    return {"average_rating": get_club_average_rating_service(db=db, club_id=club_id)}

@router.post("/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    comment: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new comment for a club"""
    # Check if the club exists
    club = get_club_by_id(db, comment.club_id)
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Club with id {comment.club_id} not found"
        )
    
    # If it's a reply, check if the parent comment exists
    if comment.parent_id:
        parent_comment = db.query(comment.parent_id).first()
        if not parent_comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Parent comment with id {comment.parent_id} not found"
            )
    
    return create_comment_service(db=db, comment=comment, user_id=current_user.id)

@router.get("/club/{club_id}/comments", response_model=List[Dict[str, Any]])
def get_club_comments(
    club_id: int,
    db: Session = Depends(get_db)
):
    """Get all comments for a specific club"""
    # Check if the club exists
    club = get_club_by_id(db, club_id)
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Club with id {club_id} not found"
        )
    
    return get_club_comments_service(db=db, club_id=club_id) 