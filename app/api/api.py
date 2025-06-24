from fastapi import APIRouter # type: ignore 

from api.endpoints import auth, users, clubs, spa, reviews, reservations

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(clubs.router, prefix="/clubs", tags=["clubs"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
api_router.include_router(reservations.router, prefix="/reservations", tags=["reservations"])

# SPA router is not under the /api/v1 prefix, it will be added separately in main.py 