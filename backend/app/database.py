from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

# Load .env here too: this module is imported before main.py calls load_dotenv(),
# so we must ensure env vars are available regardless of import order.
load_dotenv()

# Required — no default so credentials never live in source control.
# Use the Supabase Postgres connection string (Project Settings > Database).
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")
if not SQLALCHEMY_DATABASE_URL:
    # Don't fail at import time — allow empty for config validation later
    # This lets containers start successfully when env vars are injected at runtime
    SQLALCHEMY_DATABASE_URL = "sqlite:///./temp.db"  # Fallback for startup only

# SQLAlchemy only accepts the postgresql:// scheme
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {}
if "supabase.co" in SQLALCHEMY_DATABASE_URL or "supabase.com" in SQLALCHEMY_DATABASE_URL:
    # Supabase requires TLS
    connect_args["sslmode"] = "require"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=connect_args,
    # Supabase's pooler closes idle connections; check them before use
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
