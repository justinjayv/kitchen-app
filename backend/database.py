"""
Database setup for the Kitchen Inventory app.

Uses SQLite via SQLAlchemy. SQLite comfortably handles the "hundreds of
items / hundreds of recipes" scale mentioned in the brief, and requires
zero setup. If you outgrow it later, swap SQLALCHEMY_DATABASE_URL for a
Postgres/MySQL connection string and nothing else needs to change.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

SQLALCHEMY_DATABASE_URL = "sqlite:///./kitchen.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},  # needed only for SQLite
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a DB session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
