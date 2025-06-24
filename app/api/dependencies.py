from fastapi import Depends, HTTPException, status, Cookie, Header
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional
import jwt
from datetime import datetime, timedelta
from jwt.exceptions import PyJWTError
import logging

from app.db.session import get_db
from app.models.user import User
from app.core.config import settings
from app.services.user import get_user_by_id, get_user_by_email

# Configure logging
logger = logging.getLogger(__name__)

# Define standard HTTP exception
credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)

# Dependency to get current authenticated user
async def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    """
    Get the current authenticated user.
    """
    try:
       
        logger.debug(f"Token provided for authentication: {token[:10]}...")
        
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            user_id = payload.get("sub")
            
            if user_id is None:
                logger.error("Token payload does not contain user ID (sub)")
                raise credentials_exception
                
            logger.debug(f"Token decoded, user_id: {user_id}")
            
        except jwt.PyJWTError as e:
            logger.error(f"JWT decode error: {str(e)}")
            raise credentials_exception
        
        # Get user from the database
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            logger.error(f"User ID {user_id} from token not found in database")
            raise credentials_exception
            
        logger.debug(f"User found: {user.email}")
        
        return user
    except Exception as e:
        logger.error(f"Error in get_current_user: {str(e)}")
        raise credentials_exception

# Optional authentication dependency
async def get_current_user_optional(
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None),
    access_token: Optional[str] = Cookie(None)
) -> Optional[User]:
    """
    Similar to get_current_user but returns None instead of raising an exception
    if the user is not authenticated.
    """
    # Get token from Authorization header or cookie
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
    elif access_token:
        token = access_token
    
    # If no token is provided, return None (guest user)
    if not token:
        logger.debug("No token provided in get_current_user_optional, returning None")
        return None
    
    try:
        # Decode JWT token
        logger.debug(f"Optional auth: Token provided for authentication: {token[:10]}...")
        
        try:
            payload = jwt.decode(
                token, 
                settings.SECRET_KEY, 
                algorithms=[settings.ALGORITHM]
            )
            user_id = payload.get("sub")
            
            if user_id is None:
                logger.debug("Optional auth: Token payload missing user ID")
                return None
                
            logger.debug(f"Optional auth: Token decoded, user_id: {user_id}")
        except PyJWTError as e:
            logger.debug(f"Optional auth: JWT decode error: {str(e)}")
            return None
            
        # Get user from database
        user = get_user_by_id(db, user_id)
        if not user:
            logger.debug(f"Optional auth: User ID {user_id} not found in database")
            return None
            
        if not user.is_active:
            logger.debug(f"Optional auth: User {user.email} is not active")
            return None
            
        logger.debug(f"Optional auth: User found: {user.email}")
        return user
    except Exception as e:
        logger.debug(f"Optional auth: Error in get_current_user_optional: {str(e)}")
        return None 