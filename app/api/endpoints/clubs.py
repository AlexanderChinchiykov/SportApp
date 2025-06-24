from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import os
import shutil
from pathlib import Path
import uuid

from app.db.session import get_db
from app.schemas.club import ClubCreate, ClubResponse, ClubUpdate, ClubDetailResponse, PictureUpload
from app.services.club import (
    create_club as create_club_service, get_clubs_by_owner, get_club_by_id,
    update_club, add_club_picture, remove_club_picture, get_all_clubs_service,
    get_club_details_service
)
from app.api.dependencies import get_current_user
from app.models import User

router = APIRouter()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads/club_pictures")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/", response_model=ClubResponse, status_code=status.HTTP_201_CREATED)
def create_club_endpoint(
    club: ClubCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new club"""
    return create_club_service(db=db, club=club, owner_id=current_user.id)

@router.get("/", response_model=List[ClubResponse])
def get_all_clubs(
    name: str = None,
    town: str = None,
    min_price: float = None,
    max_price: float = None,
    db: Session = Depends(get_db)
):
    """Get all clubs in the system with optional filtering by name, town, and price range"""
    return get_all_clubs_service(db=db, name=name, town=town, min_price=min_price, max_price=max_price)

@router.get("/owner/{owner_id}", response_model=List[ClubResponse])
def get_clubs_by_owner_id(
    owner_id: int,
    db: Session = Depends(get_db)
):
    """Get all clubs owned by a specific owner ID"""
    return get_clubs_by_owner(db=db, owner_id=owner_id)

@router.get("/my-clubs", response_model=List[ClubResponse])
def get_my_clubs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all clubs owned by the current user"""
    return get_clubs_by_owner(db=db, owner_id=current_user.id)

@router.get("/{club_id}", response_model=ClubResponse)
def get_club(
    club_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific club by its ID"""
    club = get_club_by_id(db=db, club_id=club_id)
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Club with id {club_id} not found"
        )
    return club

@router.get("/{club_id}/details", response_model=Dict[str, Any])
def get_club_details(
    club_id: int,
    db: Session = Depends(get_db)
):
    """Get detailed information about a club including review stats"""
    club_details = get_club_details_service(db, club_id)
    if not club_details:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Club with id {club_id} not found"
        )
    return club_details

@router.put("/{club_id}", response_model=ClubResponse)
def update_club_endpoint(
    club_id: int,
    club_update: ClubUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a club"""
    club = get_club_by_id(db=db, club_id=club_id)
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Club with id {club_id} not found"
        )
    
    # Check if the user is the owner of the club
    if club.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to update this club"
        )
    
    return update_club(db=db, club_id=club_id, club_update=club_update, owner_id=current_user.id)

@router.post("/{club_id}/pictures", response_model=ClubResponse)
def add_picture(
    club_id: int,
    picture: PictureUpload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a picture to a club"""
    club = get_club_by_id(db=db, club_id=club_id)
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Club with id {club_id} not found"
        )
    
    # Check if the user is the owner of the club
    if club.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to update this club"
        )
    
    return add_club_picture(
        db=db, 
        club_id=club_id, 
        picture_url=picture.picture_url, 
        owner_id=current_user.id
    )

@router.post("/{club_id}/upload", response_model=ClubResponse)
async def upload_picture(
    club_id: int,
    owner_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload a picture file to a club. Only the owner can add pictures to their club.
    """
    # Verify club exists and user is the owner (reused in add_club_picture)
    club = get_club_by_id(db=db, club_id=club_id)
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Club not found"
        )
    
    if club.owner_id != owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the club owner can add pictures"
        )
    
    # Check file type
    valid_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Supported types: {', '.join(valid_types)}"
        )
    
    # Generate unique filename and save file
    filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = UPLOAD_DIR / filename
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving file: {str(e)}"
        )
    finally:
        file.file.close()
    
    # Generate URL for the uploaded file
    # In production, this would be a proper URL to your static file server or CDN
    picture_url = f"/uploads/club_pictures/{filename}"
    
    # Add picture URL to club
    return add_club_picture(
        db=db, 
        club_id=club_id, 
        picture_url=picture_url, 
        owner_id=owner_id
    )

@router.delete("/{club_id}/pictures", response_model=ClubResponse)
def remove_picture(
    club_id: int,
    picture_url: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a picture from a club"""
    club = get_club_by_id(db=db, club_id=club_id)
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Club with id {club_id} not found"
        )
    
    # Check if the user is the owner of the club
    if club.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to update this club"
        )
    
    return remove_club_picture(
        db=db, 
        club_id=club_id, 
        picture_url=picture_url, 
        owner_id=current_user.id
    ) 