from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import pytz
import logging

from app.db.session import get_db
from app.api.dependencies import get_current_user, get_current_user_optional
from app.models import User, Club, Reservation, PaymentMethodEnum
from app.schemas.reservation import ReservationBase, ReservationCreate, ReservationResponse, TimeSlot, AvailableSlotsResponse

router = APIRouter()
logger = logging.getLogger(__name__)

# Use the imported schemas instead of redefining here

@router.get("/my-reservations", response_model=List[Dict[str, Any]])
def get_my_reservations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all reservations for the current user with club information."""
    # Get all reservations for the current user
    reservations = db.query(Reservation).filter(Reservation.user_id == current_user.id).all()
    
    # Prepare response with enhanced information
    result = []
    for reservation in reservations:
        # Get club information
        club = db.query(Club).filter(Club.id == reservation.club_id).first()
        
        # Determine status based on reservation time
        now = datetime.now()
        reservation_end_time = reservation.reservation_time + timedelta(hours=reservation.duration)
        
        if reservation_end_time < now:
            status = "completed"
        else:
            status = "confirmed"
        
        # Format start and end times
        start_time = reservation.reservation_time.strftime('%H:%M')
        end_time = reservation_end_time.strftime('%H:%M')
        
        # Create a dictionary with all needed information
        reservation_data = {
            "id": reservation.id,
            "club_id": reservation.club_id,
            "club_name": club.name if club else "Unknown Club",
            "date": reservation.reservation_time.strftime('%Y-%m-%d'),
            "start_time": start_time,
            "end_time": end_time,
            "duration": reservation.duration,
            "status": status,
            "estimated_price": reservation.estimated_price,
            "payment_method": reservation.payment_method,
            "reservation_time": reservation.reservation_time.isoformat(),
            "created_at": reservation.created_at.isoformat() if reservation.created_at else None,
            "user_name": current_user.username
        }
        
        result.append(reservation_data)
    
    # Sort by reservation time, with upcoming reservations first
    result.sort(key=lambda x: x["reservation_time"])
    
    return result

@router.get("/club/{club_id}", response_model=List[Dict[str, Any]])
def get_club_reservations(
    club_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Get all reservations for a specific club."""
    # Verify the club exists
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Club not found")
    
    # If user is not the club owner, restrict access
    if not current_user or current_user.id != club.owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only club owners can see all reservations"
        )
    
    # Get all reservations for this club
    reservations = db.query(Reservation).filter(Reservation.club_id == club_id).all()
    
    # Prepare response with enhanced information
    result = []
    for reservation in reservations:
        # Get user information
        user = db.query(User).filter(User.id == reservation.user_id).first()
        
        # Determine status based on reservation time
        now = datetime.now()
        reservation_end_time = reservation.reservation_time + timedelta(hours=reservation.duration)
        
        if reservation_end_time < now:
            status = "completed"
        else:
            status = "confirmed"
        
        # Format start and end times
        start_time = reservation.reservation_time.strftime('%H:%M')
        end_time = reservation_end_time.strftime('%H:%M')
        
        # Create a dictionary with all needed information
        reservation_data = {
            "id": reservation.id,
            "club_id": reservation.club_id,
            "club_name": club.name,
            "date": reservation.reservation_time.strftime('%Y-%m-%d'),
            "start_time": start_time,
            "end_time": end_time,
            "duration": reservation.duration,
            "status": status,
            "estimated_price": reservation.estimated_price,
            "payment_method": reservation.payment_method,
            "reservation_time": reservation.reservation_time.isoformat(),
            "created_at": reservation.created_at.isoformat() if reservation.created_at else None,
            "user_id": reservation.user_id,
            "user_name": user.username if user else reservation.guest_name or "Unknown",
            "guest_name": reservation.guest_name
        }
        
        result.append(reservation_data)
    
    # Sort by reservation time, with upcoming reservations first
    result.sort(key=lambda x: x["reservation_time"])
    
    return result

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=ReservationResponse)
def create_reservation(
    reservation: ReservationCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Create a new reservation."""
    try:
        logger.info(f"Creating reservation: {reservation}")
        
        # Verify the club exists
        club = db.query(Club).filter(Club.id == reservation.club_id).first()
        if not club:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Club not found")
        
        # For guest users (not logged in), ensure guest_name is provided
        if not current_user and not reservation.guest_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Guest name is required for non-logged-in users"
            )
        
        # If not logged in, only card payment is allowed
        if not current_user and reservation.payment_method != PaymentMethodEnum.CARD:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only card payment is allowed for non-logged-in users"
            )
        
        # For time slot reservations, the input is in "HH:MM" format plus a date
        # We'll parse it into a naive datetime first (without timezone)
        start_time = None
        
        logger.info(f"Received reservation_time: {reservation.reservation_time}, type: {type(reservation.reservation_time)}")
        
        if isinstance(reservation.reservation_time, str) and ":" in reservation.reservation_time:
            # This is a time string like "14:00" - need to combine with date
            time_parts = reservation.reservation_time.split(":")
            hour = int(time_parts[0])
            minute = int(time_parts[1]) if len(time_parts) > 1 else 0
            
            # Get date from the request or use today
            try:
                if hasattr(reservation, 'date') and reservation.date:
                    date_str = reservation.date
                    logger.info(f"Using date from request: {date_str}")
                    reservation_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                    
                    # Create a naive datetime (no timezone) with the date and time components
                    start_time = datetime.combine(
                        reservation_date, 
                        datetime.min.time().replace(hour=hour, minute=minute)
                    )
                    logger.info(f"Created naive datetime: {start_time}")
                    
                    # NO timezone assignment - we'll keep it naive to avoid conversion
                else:
                    # Default to today if no date provided
                    today = datetime.now().date()
                    start_time = datetime.combine(
                        today, 
                        datetime.min.time().replace(hour=hour, minute=minute)
                    )
                    logger.info(f"Created naive datetime with today's date: {start_time}")
            except ValueError as e:
                logger.error(f"Error parsing reservation time: {e}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid date or time format: {e}"
                )
        else:
            # It's a datetime object
            start_time = reservation.reservation_time
            # Remove timezone if present to ensure consistent behavior
            if hasattr(start_time, 'tzinfo') and start_time.tzinfo is not None:
                # Convert to naive datetime at the same wall time
                start_time = start_time.replace(tzinfo=None)
            logger.info(f"Using datetime object: {start_time}")
        
        logger.info(f"Final reservation start time (naive): {start_time}")
        
        # Calculate end time
        end_time = start_time + timedelta(hours=reservation.duration)
        logger.info(f"Reservation end time: {end_time}")
        
        # Make sure dates are consistent - all naive datetimes
        requested_date = start_time.date()
        day_start = datetime.combine(requested_date, datetime.min.time())
        day_end = datetime.combine(requested_date, datetime.max.time())
        
        logger.info(f"Checking reservations between {day_start} and {day_end}")
        
        # Query all reservations for this club on the requested date
        # Note: In SQLAlchemy queries, it'll handle timezone conversions for us
        day_reservations = db.query(Reservation).filter(
            Reservation.club_id == reservation.club_id,
            Reservation.reservation_time >= day_start,
            Reservation.reservation_time <= day_end
        ).all()
        
        # Check for overlaps manually
        for existing_res in day_reservations:
            # Get naive datetime for consistent comparison
            existing_start = existing_res.reservation_time
            if existing_start.tzinfo is not None:
                existing_start = existing_start.replace(tzinfo=None)
                
            existing_end = existing_start + timedelta(hours=existing_res.duration)
            
            logger.info(f"Comparing with existing reservation: {existing_start} to {existing_end}")
            
            # Both datetimes are now naive, comparison is consistent
            if start_time < existing_end and end_time > existing_start:
                logger.warning(f"Time slot already booked: {start_time} to {end_time} overlaps with {existing_start} to {existing_end}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="The requested time slot is already booked"
                )
        
        # Calculate estimated price
        estimated_price = club.hourly_price * reservation.duration
        
        # Convert enum to string for SQLAlchemy
        payment_method_value = reservation.payment_method.value
        logger.info(f"Using payment method value: {payment_method_value}")
        
        # Create the reservation - using naive datetime to avoid timezone conversions
        new_reservation = Reservation(
            club_id=reservation.club_id,
            user_id=current_user.id if current_user else None,
            reservation_time=start_time,  # Use naive datetime
            duration=reservation.duration,
            guest_name=reservation.guest_name,
            payment_method=payment_method_value,  # Use string value directly
            estimated_price=estimated_price
        )
        
        db.add(new_reservation)
        db.commit()
        db.refresh(new_reservation)
        
        logger.info(f"Reservation created successfully: {new_reservation.id} for {new_reservation.reservation_time.strftime('%Y-%m-%d %H:%M')}")
        return new_reservation
    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        # Catch and log any other exceptions
        logger.error(f"Error creating reservation: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating reservation: {str(e)}"
        )

@router.delete("/{reservation_id}", response_model=Dict[str, Any])
def cancel_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Cancel an existing reservation and return its details."""
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    
    if not reservation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reservation not found")
    
    # Check permissions: only the user who made the reservation or the club owner can cancel it
    if current_user:
        club = db.query(Club).filter(Club.id == reservation.club_id).first()
        is_club_owner = club and club.owner_id == current_user.id
        
        if reservation.user_id != current_user.id and not is_club_owner:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to cancel this reservation"
            )
    else:
        # Guest users can't cancel reservations through the API
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to cancel a reservation"
        )
    
    # Get reservation details before deletion
    club_name = "Unknown Club"
    if club := db.query(Club).filter(Club.id == reservation.club_id).first():
        club_name = club.name
    
    # Get user information
    user_name = "N/A"
    if reservation.user_id:
        if user := db.query(User).filter(User.id == reservation.user_id).first():
            user_name = user.username
    elif reservation.guest_name:
        user_name = f"{reservation.guest_name} (Guest)"
    
    # Format times for response
    start_time = reservation.reservation_time.strftime('%H:%M')
    end_time = (reservation.reservation_time + timedelta(hours=reservation.duration)).strftime('%H:%M')
    
    # Create response object
    reservation_info = {
        "id": reservation.id,
        "club_id": reservation.club_id,
        "club_name": club_name,
        "date": reservation.reservation_time.strftime('%Y-%m-%d'),
        "start_time": start_time,
        "end_time": end_time,
        "duration": reservation.duration,
        "status": "cancelled",
        "message": "Reservation cancelled successfully",
        "user_name": user_name
    }
    
    # Delete the reservation
    db.delete(reservation)
    db.commit()
    
    return reservation_info

@router.get("/available-slots/{club_id}", response_model=List[Dict[str, Any]])
def get_available_slots(
    club_id: int,
    date: str = Query(..., description="Date in YYYY-MM-DD format"),
    db: Session = Depends(get_db)
):
    """Get available time slots for a specific club on a specific date."""
    # Verify the club exists
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Club not found")
    
    # Parse the date
    try:
        requested_date = datetime.strptime(date, '%Y-%m-%d').date()
        logger.info(f"Processing request for club {club_id} on date {requested_date}")
    except ValueError:
        logger.error(f"Invalid date format received: {date}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    
    # Check if date is in the past
    today = datetime.now().date()
    if requested_date < today:
        logger.warning(f"Attempted to book date in the past: {requested_date}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot book time slots in the past"
        )
    
    # Create naive datetime bounds for the requested date
    day_start = datetime.combine(requested_date, datetime.min.time())
    day_end = datetime.combine(requested_date, datetime.max.time())
    
    logger.info(f"Querying reservations between {day_start} and {day_end}")
    
    # Get ALL reservations for this club on the requested date
    reservations = db.query(Reservation).filter(
        Reservation.club_id == club_id,
        Reservation.reservation_time >= day_start,
        Reservation.reservation_time <= day_end
    ).all()
    
    # Also validate the time range query with a more explicit query
    # This will ensure we catch any reservations with date issues
    club_reservations = db.query(Reservation).filter(
        Reservation.club_id == club_id
    ).all()
    
    # Filter manually to ensure we catch all reservations on this date
    date_reservations = []
    for res in club_reservations:
        res_time = res.reservation_time
        if res_time.tzinfo is not None:
            res_time = res_time.replace(tzinfo=None)
        
        if res_time.date() == requested_date:
            date_reservations.append(res)
    
    # Log comprehensive info about all found reservations
    logger.info(f"Found {len(reservations)} existing reservations from primary query")
    logger.info(f"Found {len(date_reservations)} reservations from secondary validation query")
    
    # Combine results from both queries to be extra sure
    all_reservations = list(set(reservations + date_reservations))
    logger.info(f"Total unique reservations for club {club_id} on {requested_date}: {len(all_reservations)}")
    
    # Log each reservation for debugging
    for res in all_reservations:
        res_time = res.reservation_time
        # Ensure time is naive for consistent processing
        if res_time.tzinfo is not None:
            res_time = res_time.replace(tzinfo=None)
        logger.info(f"Existing reservation: ID={res.id}, Time={res_time.strftime('%Y-%m-%d %H:%M')}, Duration={res.duration}h")
    
    # Collect all hours that are booked
    reservation_hours = set()  # Use a set for faster lookups
    for res in all_reservations:
        # Get naive time for consistent processing
        res_time = res.reservation_time
        if res_time.tzinfo is not None:
            res_time = res_time.replace(tzinfo=None)
            
        # Add all hours covered by the reservation
        start_hour = res_time.hour
        end_hour = start_hour + int(res.duration)
        
        for hour in range(start_hour, end_hour):
            reservation_hours.add(hour)
            logger.info(f"Marking hour {hour} as reserved from reservation ID={res.id}")
    
    logger.info(f"Reserved hours: {sorted(reservation_hours)}")
    
    # Define available hours (could be customized based on club settings)
    open_hour = 8  # 8 AM
    close_hour = 22  # 10 PM
    
    # Generate all possible time slots as the UI would display them
    all_slots = []
    
    for hour in range(open_hour, close_hour):
        # Format as the UI expects (HH:00)
        slot_time = f"{hour:02d}:00"
        
        # Slot is unavailable if the hour appears in reserved hours
        is_available = hour not in reservation_hours
        
        # Add the slot with its availability status
        slot_info = {
            "start_time": slot_time,
            "end_time": f"{(hour+1):02d}:00",
            "is_available": is_available,
            "date": requested_date.strftime("%Y-%m-%d")
        }
        
        logger.info(f"Slot {slot_info['start_time']} is {'available' if is_available else 'unavailable'}")
        all_slots.append(slot_info)
    
    available_count = len([s for s in all_slots if s['is_available']])
    logger.info(f"Returning {len(all_slots)} time slots for {requested_date} with {available_count} available")
    
    return all_slots 