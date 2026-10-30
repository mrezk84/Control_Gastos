from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from dotenv import load_dotenv
import os

# Load .env here too: this module is imported before main.py calls load_dotenv(),
# so we must ensure env vars are available regardless of import order.
load_dotenv()

# En Vercel el filesystem es efímero y cada invocación es independiente.
IS_SERVERLESS = bool(os.getenv("VERCEL"))

# Required in production — no default so credentials never live in source control.
# Use the Neon *pooled* connection string (host con "-pooler").
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")
if not SQLALCHEMY_DATABASE_URL:
    if IS_SERVERLESS:
        # Un SQLite temporal en serverless perdería los datos en silencio: mejor fallar.
        raise RuntimeError("DATABASE_URL no está configurada en el entorno de Vercel")
    SQLALCHEMY_DATABASE_URL = "sqlite:///./temp.db"  # Fallback solo para desarrollo local

# SQLAlchemy only accepts the postgresql:// scheme
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

_is_postgres = SQLALCHEMY_DATABASE_URL.startswith("postgresql")
_is_local_host = any(h in SQLALCHEMY_DATABASE_URL for h in ("@localhost", "@127.0.0.1", "@db:"))

connect_args = {}
if _is_postgres and not _is_local_host and "sslmode=" not in SQLALCHEMY_DATABASE_URL:
    # Neon (y cualquier Postgres gestionado) exige TLS
    connect_args["sslmode"] = "require"

engine_kwargs = {
    "connect_args": connect_args,
    # Neon suspende el compute cuando está inactivo: validar la conexión antes de usarla
    "pool_pre_ping": True,
}
if IS_SERVERLESS:
    # Sin pool propio: el pooler de Neon (pgbouncer) ya multiplexa las conexiones
    engine_kwargs["poolclass"] = NullPool

engine = create_engine(SQLALCHEMY_DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
