from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.orm import Session
from typing import Any, Dict
import logging
import jwt
import secrets
import httpx
import json
from datetime import datetime, timedelta
import urllib.parse

from app.db.session import get_db
from app.schemas.user import UserCreate, UserResponse, UserLogin, Token
from app.services.user import create_user, authenticate_user, get_user_by_email
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

# OAuth2 configuration for Google
GOOGLE_CLIENT_ID = settings.GOOGLE_CLIENT_ID if hasattr(settings, 'GOOGLE_CLIENT_ID') else "YOUR_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET = settings.GOOGLE_CLIENT_SECRET if hasattr(settings, 'GOOGLE_CLIENT_SECRET') else "YOUR_GOOGLE_CLIENT_SECRET"
GOOGLE_REDIRECT_URI = settings.GOOGLE_REDIRECT_URI if hasattr(settings, 'GOOGLE_REDIRECT_URI') else "http://localhost:3000/oauth-callback"

# Google OAuth2 endpoints
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USER_INFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

# JWT Token functions
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

@router.post("/register", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, response: Response, db: Session = Depends(get_db)) -> Any:
    """
    Register a new user.
    """
    # Log the request for debugging
    logger.debug(f"Register request: {user_in}")
    
    try:
        user = create_user(db, user_in)
        
        # Create access token
        access_token_expires = timedelta(days=settings.ACCESS_TOKEN_EXPIRE_DAYS)
        access_token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=access_token_expires
        )
        
        # Convert user model to a dict that can be serialized
        user_data = {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
            "is_active": user.is_active,
            "is_club_owner": user.is_club_owner,
            "created_at": user.created_at
        }
        
        # Set token in cookie
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            max_age=60 * 60 * 24 * settings.ACCESS_TOKEN_EXPIRE_DAYS,
            path="/"
        )
        
        # Create response with user data and redirection info
        return {
            "user": user_data,
            "access_token": access_token,
            "token_type": "bearer",
            "redirect": "/create-club" if user.is_club_owner else None
        }
    except Exception as e:
        logger.error(f"Error during registration: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/login", response_model=Dict[str, Any])
def login(user_in: UserLogin, response: Response, db: Session = Depends(get_db)) -> Any:
    """
    Login for existing users.
    """
    logger.info(f"Login attempt for email: {user_in.email}")
    
    # Check if email exists
    user_check = get_user_by_email(db, user_in.email)
    if not user_check:
        logger.warning(f"Login failed: User with email {user_in.email} not found")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Authenticate
    user = authenticate_user(db, user_in.email, user_in.password)
    if not user:
        logger.warning(f"Login failed: Invalid password for user {user_in.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    logger.info(f"Login successful for user: {user.email} (ID: {user.id})")
    
    # Create access token
    access_token_expires = timedelta(days=settings.ACCESS_TOKEN_EXPIRE_DAYS)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )
    
    # Convert user model to a dict that can be serialized
    user_data = {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": user.role,
        "is_active": user.is_active,
        "is_club_owner": user.is_club_owner,
        "created_at": user.created_at
    }
    
    # Set token in cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=60 * 60 * 24 * settings.ACCESS_TOKEN_EXPIRE_DAYS,
        path="/"
    )
    
    logger.info(f"Generated token for user {user.email} and set cookie")
    
    # Create response with user data
    return {
        "user": user_data,
        "access_token": access_token,
        "token_type": "bearer",
        "redirect": "/dashboard" if user.is_club_owner else None
    }

# Google OAuth Routes
@router.get("/google/login")
async def google_login():
    """
    Redirect to Google for authentication
    """
    # Debug info for Google OAuth configs
    logger.info(f"Google OAuth Configuration:")
    logger.info(f"CLIENT_ID: {GOOGLE_CLIENT_ID[:10]}...{GOOGLE_CLIENT_ID[-10:] if len(GOOGLE_CLIENT_ID) > 20 else ''}")
    logger.info(f"REDIRECT_URI: {GOOGLE_REDIRECT_URI}")
    
    # Check if Google Client ID is properly configured
    if not GOOGLE_CLIENT_ID or GOOGLE_CLIENT_ID == "YOUR_GOOGLE_CLIENT_ID":
        logger.error("Google Client ID not configured properly")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth not configured. Please set GOOGLE_CLIENT_ID environment variable."
        )

    # Generate a random state to prevent CSRF
    state = secrets.token_urlsafe(32)
    
    # Log the redirect URI being used
    logger.info(f"Using redirect URI for Google OAuth: {GOOGLE_REDIRECT_URI}")
    
    # Build the Google OAuth URL
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "response_type": "code",
        "scope": "openid email profile",
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "state": state,
        "prompt": "select_account"
    }
    
    auth_url = f"{GOOGLE_AUTH_URL}?{urllib.parse.urlencode(params)}"
    logger.info(f"Redirecting to Google auth URL: {auth_url}")
    
    # Redirect to Google OAuth
    return RedirectResponse(url=auth_url)

@router.get("/google/callback")
async def google_callback(request: Request, code: str = None, state: str = None, db: Session = Depends(get_db)):
    """
    Handle Google OAuth callback
    """
    logger.info(f"Google OAuth callback received")
    logger.info(f"Code present: {bool(code)}")
    logger.info(f"State present: {bool(state)}")
    logger.info(f"Request URL: {request.url}")
    
    if not code:
        logger.error("No authorization code provided in callback")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No authorization code provided"
        )
    
    # Exchange code for token
    try:
        user_data = await exchange_google_code(code, db)
        user = user_data["user"]
        token = user_data["access_token"]
        user_info = user_data["user_info"]
        
        # Return HTML content with JavaScript to set localStorage and redirect
        logger.info(f"Authentication successful for user: {user.email}")
        
        # Create a cleaner HTML response
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Authentication Successful</title>
            <style>
                body {{ 
                    font-family: Arial, sans-serif; 
                    background-color: #121212; 
                    color: white;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                }}
                .container {{
                    background-color: #1e1e1e;
                    padding: 2rem;
                    border-radius: 8px;
                    box-shadow: 0 0 10px rgba(0,0,0,0.5);
                    text-align: center;
                    max-width: 90%;
                    width: 400px;
                }}
                h1 {{ color: #3b82f6; }}
                p {{ margin-bottom: 1rem; }}
                .spinner {{
                    border: 4px solid rgba(0, 0, 0, 0.1);
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    border-left-color: #3b82f6;
                    animation: spin 1s linear infinite;
                    margin: 20px auto;
                }}
                @keyframes spin {{
                    0% {{ transform: rotate(0deg); }}
                    100% {{ transform: rotate(360deg); }}
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Authentication Successful</h1>
                <p>Welcome, {user_info.get('given_name', user.username)}!</p>
                <div class="spinner"></div>
                <p>Redirecting to dashboard...</p>
            </div>
            
            <script>
                console.log('Google OAuth callback received, setting auth data');
                
                // Store authentication data in localStorage
                localStorage.setItem('userId', '{user.id}');
                localStorage.setItem('token', '{token}');
                localStorage.setItem('username', '{user.username}');
                localStorage.setItem('isClubOwner', '{str(user.is_club_owner).lower()}');
                localStorage.setItem('role', '{user.role}');
                localStorage.setItem('isAuthenticated', 'true');
                
                // Double check data was stored
                if (localStorage.getItem('token')) {{
                    console.log('Auth data stored successfully');
                    
                    // Create and dispatch auth change event
                    try {{
                        const event = new Event('auth-change');
                        window.dispatchEvent(event);
                        console.log('Auth change event dispatched');
                    }} catch (e) {{
                        console.error('Failed to dispatch auth change event:', e);
                    }}
                }}
                
                // Redirect after a short delay to ensure data is stored
                setTimeout(function() {{
                    console.log('Redirecting to dashboard');
                    window.location.href = '/dashboard';
                }}, 1000);
            </script>
        </body>
        </html>
        """
        
        return HTMLResponse(content=html_content)
            
    except Exception as e:
        logger.error(f"Google OAuth error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Google OAuth error: {str(e)}"
        )

@router.post("/google/token-exchange")
async def google_token_exchange(request: Request, db: Session = Depends(get_db)):
    """
    Exchange Google code for tokens and user data, returns JSON
    """
    # Try to get code from different sources (JSON body, form data, or query params)
    try:
        # First try to parse JSON body
        body_data = await request.json()
        code = body_data.get("code")
    except Exception:
        # If JSON parsing fails, try to get from form data or query params
        form_data = await request.form()
        code = form_data.get("code")
        
        if not code:
            # Try query params as last resort
            query_params = request.query_params
            code = query_params.get("code")
    
    # Log what we received
    logger.info(f"Google token exchange request received, code present: {bool(code)}")
    
    if not code:
        logger.error("No authorization code provided in request")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No authorization code provided"
        )
    
    try:
        user_data = await exchange_google_code(code, db)
        
        # Return JSON response with user data and token
        return {
            "user": {
                "id": user_data["user"].id,
                "email": user_data["user"].email,
                "username": user_data["user"].username,
                "first_name": user_data["user"].first_name,
                "last_name": user_data["user"].last_name,
                "role": user_data["user"].role,
                "is_active": user_data["user"].is_active,
                "is_club_owner": user_data["user"].is_club_owner
            },
            "access_token": user_data["access_token"],
            "token_type": "bearer"
        }
            
    except Exception as e:
        logger.error(f"Google token exchange error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Google OAuth error: {str(e)}"
        )

# Helper function to exchange Google code for user data
async def exchange_google_code(code: str, db: Session):
    logger.info(f"Starting Google code exchange with code length: {len(code)}")
    
    token_data = {
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": GOOGLE_REDIRECT_URI
    }
    
    logger.debug(f"Using redirect URI: {GOOGLE_REDIRECT_URI}")
    
    # Get token from Google
    async with httpx.AsyncClient() as client:
        logger.debug(f"Sending token request to Google: {GOOGLE_TOKEN_URL}")
        token_response = await client.post(GOOGLE_TOKEN_URL, data=token_data)
        
        logger.debug(f"Google token response status: {token_response.status_code}")
        
        if token_response.status_code != 200:
            error_text = token_response.text
            logger.error(f"Google token error: {error_text}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to get token from Google: {error_text}"
            )
            
        token_json = token_response.json()
        access_token = token_json.get("access_token")
        logger.debug("Successfully obtained Google access token")
        
        # Get user info using the token
        logger.debug(f"Fetching user info from: {GOOGLE_USER_INFO_URL}")
        user_response = await client.get(
            GOOGLE_USER_INFO_URL,
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        logger.debug(f"Google user info response status: {user_response.status_code}")
        
        if user_response.status_code != 200:
            error_text = user_response.text
            logger.error(f"Google user info error: {error_text}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to get user info from Google: {error_text}"
            )
            
        user_info = user_response.json()
        
        # Extract user data
        email = user_info.get("email")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not provided by Google"
            )
            
        # Check if user exists, if not create a new one
        user = get_user_by_email(db, email)
        if not user:
            # Create a new user
            user_create = UserCreate(
                email=email,
                username=email.split("@")[0],  # Simple username from email
                password=secrets.token_urlsafe(16),  # Random password
                first_name=user_info.get("given_name", ""),
                last_name=user_info.get("family_name", ""),
                is_active=True
            )
            user = create_user(db, user_create)
        
        # Create access token
        access_token_expires = timedelta(days=settings.ACCESS_TOKEN_EXPIRE_DAYS)
        jwt_token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=access_token_expires
        )
        
        return {
            "user": user,
            "access_token": jwt_token,
            "user_info": user_info
        }

@router.get("/google-debug", response_class=HTMLResponse)
async def google_debug():
    """
    Debug endpoint for Google OAuth
    """
    content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Google OAuth Debug</title>
        <style>
            body {{ font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }}
            pre {{ background-color: #f4f4f4; padding: 10px; overflow-x: auto; }}
        </style>
    </head>
    <body>
        <h1>Google OAuth Configuration</h1>
        <p>This page shows your current Google OAuth configuration:</p>
        
        <h2>Client ID:</h2>
        <pre>{GOOGLE_CLIENT_ID}</pre>
        
        <h2>Redirect URI:</h2>
        <pre>{GOOGLE_REDIRECT_URI}</pre>
        
        <h2>Full Auth URL:</h2>
        <pre>{GOOGLE_AUTH_URL}?client_id={GOOGLE_CLIENT_ID}&response_type=code&scope=openid+email+profile&redirect_uri={GOOGLE_REDIRECT_URI}</pre>
        
        <h2>Test Link:</h2>
        <p><a href="{GOOGLE_AUTH_URL}?client_id={GOOGLE_CLIENT_ID}&response_type=code&scope=openid+email+profile&redirect_uri={GOOGLE_REDIRECT_URI}&prompt=select_account">Test Google OAuth Login</a></p>
    </body>
    </html>
    """
    return HTMLResponse(content=content) 