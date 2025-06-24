from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Dict, Any
from app.models import Review, Comment, User, Club, UserBadgeEnum
from app.schemas.review import ReviewCreate, CommentCreate

def create_review_service(db: Session, review: ReviewCreate, user_id: int) -> Review:
    """Create a new review for a club and award the reviewer badge"""
    db_review = Review(
        rating=review.rating,
        comment=review.comment,
        club_id=review.club_id,
        user_id=user_id
    )
    db.add(db_review)
    
    # Award the reviewer badge
    user = db.query(User).filter(User.id == user_id).first()
    user.add_badge(UserBadgeEnum.REVIEWER)
    
    db.commit()
    db.refresh(db_review)
    return db_review

def get_club_reviews_service(db: Session, club_id: int) -> List[Dict[str, Any]]:
    """Get all reviews for a specific club with user information"""
    reviews = db.query(
        Review,
        User.username.label("user_name"),
        User.role.label("user_role"),
        User.id.label("user_id")
    ).join(
        User, Review.user_id == User.id
    ).filter(
        Review.club_id == club_id
    ).all()
    
    result = []
    for review, user_name, user_role, user_id in reviews:
        review_dict = {
            "id": review.id,
            "rating": review.rating,
            "comment": review.comment,
            "club_id": review.club_id,
            "user_id": user_id,
            "created_at": review.created_at,
            "user_name": user_name,
            "user_role": user_role
        }
        result.append(review_dict)
    
    return result

def get_club_average_rating_service(db: Session, club_id: int) -> float:
    """Get the average rating for a club"""
    result = db.query(func.avg(Review.rating)).filter(Review.club_id == club_id).scalar()
    return float(result) if result else 0.0

def create_comment_service(db: Session, comment: CommentCreate, user_id: int) -> Comment:
    """Create a new comment for a club and award the commenter badge"""
    db_comment = Comment(
        content=comment.content,
        club_id=comment.club_id,
        user_id=user_id,
        parent_id=comment.parent_id
    )
    db.add(db_comment)
    
    # Award the commenter badge
    user = db.query(User).filter(User.id == user_id).first()
    user.add_badge(UserBadgeEnum.COMMENTER)
    
    # Check if the user is very active (has both badges)
    if user.has_badge(UserBadgeEnum.REVIEWER):
        user.add_badge(UserBadgeEnum.ACTIVE_MEMBER)
    
    db.commit()
    db.refresh(db_comment)
    return db_comment

def get_club_comments_service(db: Session, club_id: int) -> List[Dict[str, Any]]:
    """Get all top-level comments for a specific club with user information and replies"""
    # Get top-level comments (no parent_id)
    top_comments = db.query(
        Comment,
        User.username.label("user_name"),
        User.role.label("user_role"),
        User.id.label("user_id")
    ).join(
        User, Comment.user_id == User.id
    ).filter(
        Comment.club_id == club_id,
        Comment.parent_id == None
    ).all()
    
    # Get all replies for this club
    replies = db.query(
        Comment,
        User.username.label("user_name"),
        User.role.label("user_role"),
        User.id.label("user_id")
    ).join(
        User, Comment.user_id == User.id
    ).filter(
        Comment.club_id == club_id,
        Comment.parent_id != None
    ).all()
    
    # Create a dictionary of replies by parent_id for fast lookup
    replies_by_parent = {}
    for reply, user_name, user_role, user_id in replies:
        reply_dict = {
            "id": reply.id,
            "content": reply.content,
            "club_id": reply.club_id,
            "user_id": user_id,
            "parent_id": reply.parent_id,
            "created_at": reply.created_at,
            "user_name": user_name,
            "user_role": user_role
        }
        
        if reply.parent_id not in replies_by_parent:
            replies_by_parent[reply.parent_id] = []
        
        replies_by_parent[reply.parent_id].append(reply_dict)
    
    # Build the result with top-level comments and their replies
    result = []
    for comment, user_name, user_role, user_id in top_comments:
        comment_dict = {
            "id": comment.id,
            "content": comment.content,
            "club_id": comment.club_id,
            "user_id": user_id,
            "parent_id": comment.parent_id,
            "created_at": comment.created_at,
            "user_name": user_name,
            "user_role": user_role,
            "replies": replies_by_parent.get(comment.id, [])
        }
        result.append(comment_dict)
    
    return result 