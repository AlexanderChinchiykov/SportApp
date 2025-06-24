from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from pathlib import Path
import os

# Create templates directory if it doesn't exist
templates_dir = Path("templates")
templates_dir.mkdir(exist_ok=True)

# Initialize templates
templates = Jinja2Templates(directory="templates")

# Create router for SPA routes
router = APIRouter()

@router.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("spa.html", {"request": request})

@router.get("/login", response_class=HTMLResponse)
async def login_route(request: Request):
    return templates.TemplateResponse("spa.html", {"request": request})

@router.get("/register", response_class=HTMLResponse)
async def register_route(request: Request):
    return templates.TemplateResponse("spa.html", {"request": request})

@router.get("/dashboard", response_class=HTMLResponse)
async def dashboard_route(request: Request):
    return templates.TemplateResponse("spa.html", {"request": request})

@router.get("/create-club", response_class=HTMLResponse)
async def create_club_route(request: Request):
    return templates.TemplateResponse("spa.html", {"request": request})

@router.get("/clubs", response_class=HTMLResponse)
async def clubs_list_route(request: Request):
    return templates.TemplateResponse("spa.html", {"request": request})

@router.get("/clubs/{club_id}", response_class=HTMLResponse)
async def club_details_route(request: Request, club_id: int):
    return templates.TemplateResponse("spa.html", {"request": request, "club_id": club_id}) 