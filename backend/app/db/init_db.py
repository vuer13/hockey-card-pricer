from .database import Base
from .database import engine
from . import model

def init_db():
    """Initializes the database by creating all tables."""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Done.")