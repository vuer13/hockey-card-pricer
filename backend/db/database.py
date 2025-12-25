import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Default to local host if Database URL is not set in environment variables
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres@localhost:5432/hockey_cards")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False
)
Base = declarative_base() # Base class for declarative models; to tell classes they are tables