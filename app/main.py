from fastapi import FastAPI, Depends, Request, HTTPException# type: ignore 
from fastapi.middleware.cors import CORSMiddleware# type: ignore 
from fastapi.responses import HTMLResponse, RedirectResponse, FileResponse# type: ignore 
from fastapi.staticfiles import StaticFiles# type: ignore 
from fastapi.templating import Jinja2Templates# type: ignore 
import logging
import os
from pathlib import Path
from dotenv import load_dotenv# type: ignore 

# Load environment variables from .env file
load_dotenv()

# Fix imports by removing 'app.' prefix since we're running from inside the app directory
from api.api import api_router
from api.endpoints import spa
from core.config import settings
from db.session import engine, Base, get_db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create uploads directory if it doesn't exist
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)
club_pictures_dir = Path("uploads/club_pictures")
club_pictures_dir.mkdir(parents=True, exist_ok=True)

# Initialize Jinja2 templates
templates_dir = Path("templates")
templates_dir.mkdir(exist_ok=True)
templates = Jinja2Templates(directory="templates")

# Check if we have a built React app
react_build_dir = Path("frontend-react/build")
react_index_html = react_build_dir / "index.html"
use_react = react_build_dir.exists() and react_index_html.exists()

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Mount static files directory for uploaded files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Load the SPA JavaScript
try:
    with open("templates/spa.js", "r") as file:
        spa_js = file.read()
except:
    spa_js = "console.error('SPA JavaScript file not found');"
    logger.error("SPA JavaScript file not found")

# Include SPA routes
if not use_react:
    # Only use the SPA routes if we don't have the React build
    @app.get("/", response_class=HTMLResponse)
    async def read_root(request: Request):
        return templates.TemplateResponse("spa.html", {"request": request, "spa_js": spa_js})

    # Add all SPA routes
    app.include_router(spa.router)

logger.info("Application starting. Database tables should be already created.")

@app.get("/health")
def health_check():
    try:
        # Try to get a database connection
        next(get_db())
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}

# Define routes to serve the React app for all non-API routes if available
if use_react:
    # Mount React static files
    app.mount("/static", StaticFiles(directory=str(react_build_dir / "static")), name="static")
    
    # Also mount any other static files from the React build
    static_files = list(react_build_dir.glob("*.js")) + list(react_build_dir.glob("*.json")) + list(react_build_dir.glob("*.ico")) + list(react_build_dir.glob("*.png"))
    for static_file in static_files:
        @app.get(f"/{static_file.name}")
        async def serve_static_file(static_file_name=static_file.name):
            return FileResponse(str(react_build_dir / static_file_name))
    
    logger.info(f"React app mounted from {str(react_build_dir)}")
    
    @app.get("/{full_path:path}", response_class=HTMLResponse)
    async def serve_react_app(request: Request, full_path: str = ""):
        # Skip specific paths that should be handled by API or other specific handlers
        api_paths = [
            # API paths
            "api/",
            # Documentation paths  
            "docs", "redoc", "openapi.json",
            # Health check
            "health",
            # Static files
            "static/", "uploads/"
        ]
        
        if any(full_path.startswith(path) for path in api_paths):
            # Let FastAPI's default handlers handle these requests
            raise HTTPException(status_code=404, detail="Not Found")
        
        # Serve the React app
        return FileResponse(str(react_index_html))
else:
    logger.warning("React app build not found. Using SPA HTML templates instead.") 