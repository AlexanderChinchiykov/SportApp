#!/usr/bin/env python3
"""
Script to test user login directly against the database.
"""

import sys
import os
import logging
from sqlalchemy.orm import Session

# Add parent directory to path to make imports work
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import get_db
from app.models.user import User
from app.utils.password import verify_password, hash_password
from app.services.user import get_user_by_email

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_user_login(email, password):
    """Test login for a user with the given email and password."""
    logger.info(f"Testing login for user: {email}")
    
    # Get database session
    db = next(get_db())
    
    # Get user by email
    user = get_user_by_email(db, email)
    
    if not user:
        logger.error(f"User with email {email} not found in database")
        return False
    
    logger.info(f"Found user: ID={user.id}, Username={user.username}, Email={user.email}")
    
    # Check password
    is_valid = verify_password(password, user.hashed_password)
    
    if is_valid:
        logger.info(f"Password verification successful for user {email}")
    else:
        logger.error(f"Password verification failed for user {email}")
        logger.info(f"Stored hash: {user.hashed_password}")
        
        # Create a new hash of the provided password for comparison
        new_hash = hash_password(password)
        logger.info(f"New hash of provided password: {new_hash}")
    
    return is_valid

def list_all_users():
    """List all users in the database."""
    logger.info("Listing all users in database")
    
    # Get database session
    db = next(get_db())
    
    # Get all users
    users = db.query(User).all()
    
    if not users:
        logger.info("No users found in database")
        return
    
    logger.info(f"Found {len(users)} users:")
    for user in users:
        logger.info(f"ID: {user.id}, Username: {user.username}, Email: {user.email}, Active: {user.is_active}")

if __name__ == "__main__":
    # List users if requested
    if len(sys.argv) == 2 and sys.argv[1] == "--list-users":
        list_all_users()
        sys.exit(0)
    
    # Check if sufficient args for login test
    elif len(sys.argv) == 3:
        # Test login
        email = sys.argv[1]
        password = sys.argv[2]
        
        if test_user_login(email, password):
            logger.info("Login test successful")
        else:
            logger.error("Login test failed")
            sys.exit(1)
    else:
        print("Usage: python test_login.py <email> <password>")
        print("  or   python test_login.py --list-users")
        sys.exit(1) 