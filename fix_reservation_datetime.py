import logging
from sqlalchemy import text
from app.db.session import engine

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fix_reservation_datetime():
    conn = engine.connect()
    
    try:
        # Check if we need to update any existing reservations
        result = conn.execute(text("SELECT COUNT(*) FROM reservations")).scalar()
        
        if result > 0:
            logger.info(f"Found {result} existing reservations to update")
            
            # Step 1: Create a temporary column without timezone info
            logger.info("Creating temporary column for reservation_time...")
            conn.execute(text("""
            ALTER TABLE reservations 
            ADD COLUMN reservation_time_temp TIMESTAMP WITHOUT TIME ZONE;
            """))
            
            # Step 2: Copy data with timezone conversion to local time
            logger.info("Converting reservation times to local time...")
            conn.execute(text("""
            UPDATE reservations 
            SET reservation_time_temp = reservation_time AT TIME ZONE 'UTC';
            """))
            
            # Step 3: Drop the old column
            logger.info("Dropping old column...")
            conn.execute(text("""
            ALTER TABLE reservations 
            DROP COLUMN reservation_time;
            """))
            
            # Step 4: Rename the new column
            logger.info("Renaming temporary column...")
            conn.execute(text("""
            ALTER TABLE reservations 
            RENAME COLUMN reservation_time_temp TO reservation_time;
            """))
            
            # Step 5: Add not null constraint
            logger.info("Adding not null constraint...")
            conn.execute(text("""
            ALTER TABLE reservations 
            ALTER COLUMN reservation_time SET NOT NULL;
            """))
            
            logger.info("Reservation times updated successfully")
        else:
            logger.info("No existing reservations found")
            # Update column type for future reservations
            conn.execute(text("""
            ALTER TABLE reservations 
            ALTER COLUMN reservation_time TYPE TIMESTAMP WITHOUT TIME ZONE;
            """))
            logger.info("Column type updated for future reservations")
        
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        logger.error(f"Error fixing reservation time: {e}")
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    success = fix_reservation_datetime()
    if success:
        print("Reservation datetime handling fixed successfully!")
    else:
        print("Failed to fix reservation datetime. Check logs for details.") 