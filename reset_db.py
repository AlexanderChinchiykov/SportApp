import logging
from sqlalchemy import text
from app.db.session import engine

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def reset_database():
    conn = engine.connect()
    
    # Drop all tables in correct order
    logger.info("Dropping all tables...")
    try:
        # Drop tables
        conn.execute(text("DROP TABLE IF EXISTS comments CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS reviews CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS clubs CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS users CASCADE;"))
        
        # Drop enum types
        conn.execute(text("DROP TYPE IF EXISTS userroleenum CASCADE;"))
        conn.execute(text("DROP TYPE IF EXISTS userbadgeenum CASCADE;"))
        
        conn.commit()
        logger.info("All tables dropped successfully")
        
        # Now create tables with proper imports
        logger.info("Creating all tables using SQLAlchemy...")
        from app.db.session import Base
        from app.models.user import User, UserRoleEnum, UserBadgeEnum
        from app.models.club import Club
        from app.models.review import Review, Comment
        
        # Create tables
        Base.metadata.create_all(bind=engine)
        logger.info("All tables created successfully")
        
        return True
    except Exception as e:
        conn.rollback()
        logger.error(f"Error resetting database: {e}")
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    success = reset_database()
    if success:
        print("Database reset successfully!")
    else:
        print("Failed to reset database. Check logs for details.") 