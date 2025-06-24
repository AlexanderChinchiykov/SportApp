from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from typing import List, Optional, Dict, Any
import json

from app.models.club import Club
from app.schemas.club import ClubCreate, ClubUpdate, PictureUpload
from app.models.user import User, UserRoleEnum
from app.models import Review, Comment

def get_club_by_id(db: Session, club_id: int) -> Optional[Club]:
    return db.query(Club).filter(Club.id == club_id).first()

def get_clubs_by_owner(db: Session, owner_id: int) -> List[Club]:
    return db.query(Club).filter(Club.owner_id == owner_id).all()

def create_club(db: Session, club: ClubCreate, owner_id: int) -> Club:
    # Check if owner exists and is a club owner
    owner = db.query(User).filter(User.id == owner_id).first()
    if not owner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Owner not found"
        )
    
    if not owner.is_club_owner:
        # Update user to be a club owner
        owner.is_club_owner = True
        owner.role = UserRoleEnum.CLUB_OWNER
        db.add(owner)
    
    # Create new club
    db_club = Club(
        name=club.name,
        town=club.town,
        telephone=club.telephone,
        hourly_price=club.hourly_price,
        description=club.description,
        address=club.address,
        website=club.website,
        social_media=club.social_media,
        pictures="[]",  
        owner_id=owner_id
    )
    
    db.add(db_club)
    db.commit()
    db.refresh(db_club)
    
    return db_club

def update_club(db: Session, club_id: int, club_update: ClubUpdate, owner_id: int) -> Club:
    """Update a club's information if the user is the owner."""
    db_club = get_club_by_id(db, club_id)
    if not db_club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Club not found"
        )
    
    # Verify ownership
    if db_club.owner_id != owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the club owner can update club information"
        )
    
    # Update fields
    update_data = club_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_club, key, value)
    
    db.add(db_club)
    db.commit()
    db.refresh(db_club)
    
    return db_club

def add_club_picture(db: Session, club_id: int, picture_url: str, owner_id: int) -> Club:
    """Add a picture URL to a club."""
    db_club = get_club_by_id(db, club_id)
    if not db_club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Club not found"
        )
    
    # Verify ownership
    if db_club.owner_id != owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the club owner can add pictures"
        )
    
    db_club.add_picture(picture_url)
    
    db.add(db_club)
    db.commit()
    db.refresh(db_club)
    
    return db_club

def remove_club_picture(db: Session, club_id: int, picture_url: str, owner_id: int) -> Club:
    """Remove a picture URL from a club."""
    db_club = get_club_by_id(db, club_id)
    if not db_club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Club not found"
        )
    
    # Verify ownership
    if db_club.owner_id != owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the club owner can remove pictures"
        )
    
    if not db_club.remove_picture(picture_url):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Picture not found"
        )
    
    db.add(db_club)
    db.commit()
    db.refresh(db_club)
    
    return db_club

def get_all_clubs_service(db: Session, name: str = None, town: str = None, min_price: float = None, max_price: float = None) -> List[Club]:
    """Get all clubs in the system with optional filtering."""
    query = db.query(Club)
    
    # Apply filters if provided
    if name:
        query = query.filter(Club.name.ilike(f"%{name}%"))
    if town:
        query = query.filter(Club.town.ilike(f"%{town}%"))
    if min_price is not None:
        query = query.filter(Club.hourly_price >= min_price)
    if max_price is not None:
        query = query.filter(Club.hourly_price <= max_price)
        
    return query.all()

def get_club_details_service(db: Session, club_id: int) -> Dict[str, Any]:
    """Get detailed club info including review stats and owner details"""
    club = db.query(Club).filter(Club.id == club_id).first()
    
    if not club:
        return None
    
    # Get owner name
    owner = db.query(User).filter(User.id == club.owner_id).first()
    owner_name = owner.username if owner else None
    
    # Get average rating
    avg_rating = db.query(func.avg(Review.rating)).filter(Review.club_id == club_id).scalar()
    avg_rating = float(avg_rating) if avg_rating else 0.0
    
    # Get review count
    reviews_count = db.query(func.count(Review.id)).filter(Review.club_id == club_id).scalar()
    
    # Get comment count
    comments_count = db.query(func.count(Comment.id)).filter(Comment.club_id == club_id).scalar()
    
    # Add additional fields to club dict
    result = {
        "id": club.id,
        "name": club.name,
        "town": club.town,
        "telephone": club.telephone,
        "hourly_price": club.hourly_price,
        "description": club.description,
        "address": club.address,
        "website": club.website,
        "social_media": club.social_media,
        "pictures": club.get_pictures(),
        "owner_id": club.owner_id,
        "created_at": club.created_at,
        "average_rating": avg_rating,
        "reviews_count": reviews_count,
        "comments_count": comments_count,
        "owner_name": owner_name
    }
    
    return result 