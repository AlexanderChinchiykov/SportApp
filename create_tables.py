from app.db.session import engine, Base
from app.models.user import User, UserRoleEnum, UserBadgeEnum
from app.models.club import Club
from app.models.review import Review, Comment
from app.models.reservation import Reservation, PaymentMethodEnum
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_tables():
    logger.info("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    
    logger.info("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    
    logger.info("Tables created successfully!")

if __name__ == "__main__":
    create_tables() 