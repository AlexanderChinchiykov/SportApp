#!/usr/bin/env python
"""
Reset or create an admin user with known credentials.

This script creates or resets the admin user password.
"""

import sys
import os
import logging
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)

def reset_admin_password():
    """
    Reset or create an admin user with known credentials.
    """
    # Database URL - modify if needed
    db_user = "postgres"
    db_password = "1234"
    db_host = "localhost"
    db_port = "5432"
    db_name = "sportapp"
    
    database_url = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    
    # Create SQLAlchemy engine and session
    engine = create_engine(database_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Admin credentials
        admin_email = 'admin@example.com'
        admin_password = 'admin123!'
        
        # Check if admin already exists
        stmt = "SELECT id, email, username FROM users WHERE email = :email"
        existing_admin = db.execute(stmt, {'email': admin_email}).fetchone()
        
        if not existing_admin:
            # Create admin user
            logger.info(f"Creating new admin user with email: {admin_email}")
            
            # SQL to insert new admin user
            stmt = """
            INSERT INTO users (email, username, password_hash, first_name, last_name, is_active, is_club_owner, role, created_at)
            VALUES (:email, :username, :password_hash, :first_name, :last_name, :is_active, :is_club_owner, :role, :created_at)
            """
            
            db.execute(stmt, {
                'email': admin_email,
                'username': 'admin',
                'password_hash': get_password_hash(admin_password),
                'first_name': 'Admin',
                'last_name': 'User',
                'is_active': True,
                'is_club_owner': True,
                'role': 'admin',
                'created_at': datetime.now()
            })
            
            db.commit()
            logger.info("Admin user created successfully")
        else:
            # Update admin password
            logger.info(f"Updating password for existing admin user: {admin_email}")
            
            # SQL to update admin password
            stmt = """
            UPDATE users 
            SET password_hash = :password_hash
            WHERE email = :email
            """
            
            db.execute(stmt, {
                'email': admin_email,
                'password_hash': get_password_hash(admin_password)
            })
            
            db.commit()
            logger.info("Admin user password updated successfully")
        
        logger.info(f"Admin login credentials: Email: {admin_email}, Password: {admin_password}")
        
    except Exception as e:
        logger.error(f"Error creating/updating admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_admin_password() 