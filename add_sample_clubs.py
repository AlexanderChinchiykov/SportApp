import sys
import os

# Add the parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "")))

from sqlalchemy.orm import Session
from app.db.session import get_db, engine, Base
from app.models import Club, User, UserRoleEnum
from app.schemas.club import ClubCreate
from app.services.club import create_club

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

# Sample club data
sample_clubs = [
    {
        "name": "TK Tennis Center",
        "town": "Sofia",
        "telephone": "+359 888 123 456",
        "hourly_price": 25.0,
        "address": "123 Tennis Street, Sofia, Bulgaria",
        "description": "A premium tennis center with 6 indoor courts and professional coaching.",
        "website": "https://tk-tennis.bg"
    },
    {
        "name": "Sport Palace",
        "town": "Plovdiv",
        "telephone": "+359 888 234 567",
        "hourly_price": 22.0,
        "address": "45 Sport Avenue, Plovdiv, Bulgaria",
        "description": "Multi-sport facility with tennis, basketball, and swimming options.",
        "website": "https://sportpalace.bg"
    },
    {
        "name": "Elite Tennis Club",
        "town": "Varna",
        "telephone": "+359 888 345 678",
        "hourly_price": 20.0,
        "address": "78 Beach Boulevard, Varna, Bulgaria",
        "description": "Beautiful seaside tennis club with clay and hard courts.",
        "website": "https://elitetennis-varna.bg"
    },
    {
        "name": "ProSport Arena",
        "town": "Burgas",
        "telephone": "+359 888 456 789",
        "hourly_price": 18.0,
        "address": "90 Marina Way, Burgas, Bulgaria",
        "description": "Professional tennis facilities with tournament-grade courts.",
        "website": "https://prosport-burgas.bg"
    },
    {
        "name": "Central Tennis Complex",
        "town": "Sofia",
        "telephone": "+359 888 567 890",
        "hourly_price": 30.0,
        "address": "5 Central Park, Sofia, Bulgaria",
        "description": "Premium downtown tennis facility with indoor and outdoor options.",
        "website": "https://centraltennis.bg"
    },
    {
        "name": "Tennis Brothers Club",
        "town": "Ruse",
        "telephone": "+359 888 678 901",
        "hourly_price": 15.0,
        "address": "123 Danube Street, Ruse, Bulgaria",
        "description": "Family-friendly tennis club with lessons for all ages.",
        "website": "https://tennisbrothers.bg"
    },
    {
        "name": "Victory Sports Center",
        "town": "Stara Zagora",
        "telephone": "+359 888 789 012",
        "hourly_price": 17.0,
        "address": "456 Victory Road, Stara Zagora, Bulgaria",
        "description": "Modern tennis facilities with night lighting and pro shop.",
        "website": "https://victory-tennis.bg"
    },
    {
        "name": "Champions Tennis Academy",
        "town": "Sofia",
        "telephone": "+359 888 890 123",
        "hourly_price": 28.0,
        "address": "789 Champions Blvd, Sofia, Bulgaria",
        "description": "High-performance tennis academy for competitive players.",
        "website": "https://champions-tennis.bg"
    },
    {
        "name": "Tennis Park",
        "town": "Plovdiv",
        "telephone": "+359 888 901 234",
        "hourly_price": 20.0,
        "address": "101 Park Street, Plovdiv, Bulgaria",
        "description": "Beautiful tennis courts in a park setting with cafe.",
        "website": "https://tennispark-plovdiv.bg"
    },
    {
        "name": "Ace Tennis Club",
        "town": "Veliko Tarnovo",
        "telephone": "+359 888 012 345",
        "hourly_price": 16.0,
        "address": "22 Historic Hill, Veliko Tarnovo, Bulgaria",
        "description": "Scenic tennis club with professional coaching and tournaments.",
        "website": "https://acetennis.bg"
    }
]

def main():
    # Get admin user or create if not exists
    db = next(get_db())
    admin_user = db.query(User).filter(User.role == UserRoleEnum.ADMIN).first()
    
    if not admin_user:
        # Also check by username
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            print("No admin user found! Please ensure an admin user exists before running this script.")
            return
    
    print(f"Using admin user: {admin_user.username} (ID: {admin_user.id})")
    
    # Add clubs
    clubs_added = 0
    for club_data in sample_clubs:
        # Check if club with this name already exists
        existing_club = db.query(Club).filter(Club.name == club_data["name"]).first()
        if existing_club:
            print(f"Club '{club_data['name']}' already exists, skipping...")
            continue
        
        # Create club schema
        club_create = ClubCreate(**club_data)
        
        try:
            # Create club using service
            new_club = create_club(db, club_create, admin_user.id)
            print(f"Created club: {new_club.name} (ID: {new_club.id})")
            clubs_added += 1
        except Exception as e:
            print(f"Error creating club '{club_data['name']}': {str(e)}")
    
    print(f"\nTotal clubs added: {clubs_added}")
    
if __name__ == "__main__":
    main() 