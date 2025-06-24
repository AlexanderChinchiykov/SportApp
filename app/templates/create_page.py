from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
import os
from pathlib import Path

# Create templates directory if it doesn't exist
templates_dir = Path("app/templates")
templates_dir.mkdir(exist_ok=True)

# Initialize templates
templates = Jinja2Templates(directory="app/templates")

# Create router for HTML pages
router = APIRouter()

@router.get("/dashboard", response_class=HTMLResponse)
async def dashboard_page(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request})

@router.get("/create-club", response_class=HTMLResponse)
async def create_club_page(request: Request):
    return templates.TemplateResponse("create_club.html", {"request": request})

@router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@router.get("/register", response_class=HTMLResponse)
async def register_page(request: Request):
    return templates.TemplateResponse("register.html", {"request": request})

@router.get("/clubs", response_class=HTMLResponse)
async def clubs_list_page(request: Request):
    return templates.TemplateResponse("clubs_list.html", {"request": request})

@router.get("/clubs/{club_id}", response_class=HTMLResponse)
async def club_details_page(request: Request, club_id: int):
    return templates.TemplateResponse("club_details.html", {"request": request, "club_id": club_id}) 