import os

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Database URL - easily switch between SQLite and PostgreSQL/Supabase
# For SQLite (MVP):
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./picklejar.db")

# For Supabase/PostgreSQL (Production):
# DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@host:5432/database")

# SQLite specific configuration
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=True,  # Set to False in production
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for models
Base = declarative_base()


# Dependency to get database session
def get_db():
    """
    Dependency function to get database session.
    Use this in FastAPI route dependencies.

    Example:
        @app.get("/items")
        def read_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
