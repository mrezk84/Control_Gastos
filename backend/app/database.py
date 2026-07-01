from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

# Load .env here too: this module is imported before main.py calls load_dotenv(),
# so we must ensure env vars are available regardless of import order.
load_dotenv()

# Required — no default so credentials never live in source control.
# Set DATABASE_URL in the environment (.env locally, platform vars in prod).
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")
if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("DATABASE_URL must be set in environment variables")

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()