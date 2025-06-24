import logging
from sqlalchemy import text
from app.db.session import engine, Base, get_db
from app.models.reservation import PaymentMethodEnum

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fix_payment_enum():
    conn = engine.connect()
    
    try:
        # Approach 1: Change the column type directly
        logger.info("Modifying payment_method column type...")
        
        # First, create a temporary column
        conn.execute(text("""
        ALTER TABLE reservations 
        ADD COLUMN payment_method_temp VARCHAR(10);
        """))
        
        # Copy data with string values 
        conn.execute(text("""
        UPDATE reservations 
        SET payment_method_temp = payment_method::TEXT;
        """))
        
        # Drop the old column
        conn.execute(text("""
        ALTER TABLE reservations 
        DROP COLUMN payment_method;
        """))
        
        # Rename the temporary column
        conn.execute(text("""
        ALTER TABLE reservations 
        RENAME COLUMN payment_method_temp TO payment_method;
        """))
        
        # Add not null constraint
        conn.execute(text("""
        ALTER TABLE reservations 
        ALTER COLUMN payment_method SET NOT NULL;
        """))
        
        conn.commit()
        logger.info("Payment method column fixed successfully")
        
        # Alternative approach (if direct modification doesn't work):
        # Drop and recreate the whole table
        # This is more radical but can be useful if the above approach fails
        
        return True
    except Exception as e:
        conn.rollback()
        logger.error(f"Error fixing payment method enum: {e}")
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    success = fix_payment_enum()
    if success:
        print("Payment method enum fixed successfully!")
    else:
        print("Failed to fix payment method enum. Check logs for details.") 