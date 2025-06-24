from sqlalchemy import create_engine                                                    # type: ignore
from sqlalchemy.ext.declarative import declarative_base                                  # type: ignore
from sqlalchemy.orm import sessionmaker                                                # type: ignore

from app.core.config import settings

engine = create_engine(settings.get_database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 