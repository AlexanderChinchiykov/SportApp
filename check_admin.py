import sys
import os

# Add the parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "")))

from sqlalchemy.orm import Session
from app.db.session import get_db, engine, Base
from app.models import User, UserRoleEnum
from app.core.security import get_password_hash

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

def main():
    # Check for admin user
    db = next(get_db())
    admin_user = db.query(User).filter(User.role == UserRoleEnum.ADMIN).first()
    
    if admin_user:
        print(f"Admin user found: {admin_user.username} (ID: {admin_user.id})")
        return admin_user
    
    # Also check by username if role-based query doesn't work
    admin_by_username = db.query(User).filter(User.username == "admin").first()
    if admin_by_username:
        print(f"Admin user found by username: {admin_by_username.username} (ID: {admin_by_username.id})")
        return admin_by_username
        
    print("No admin user found, creating one...")
    
    try:
        # Create admin user
        admin = User(
            email="admin@sportsapp.com",
            username="admin",
            hashed_password=get_password_hash("admin123"),  # Secure password would be better in production
            first_name="Admin",
            last_name="User",
            role=UserRoleEnum.ADMIN,
            is_active=True
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print(f"Created admin user: admin@sportsapp.com (ID: {admin.id})")
        print("Username: admin")
        print("Password: admin123")
        return admin
    except Exception as e:
        db.rollback()
        print(f"Error creating admin user: {str(e)}")
        
        # Try to find existing admin user again
        admin_user = db.query(User).filter(User.username == "admin").first()
        if admin_user:
            print(f"Found existing admin user: {admin_user.username} (ID: {admin_user.id})")
            return admin_user
        return None
    
if __name__ == "__main__":
    main() 