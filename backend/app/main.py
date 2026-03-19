from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import expenses, auth
from .routes import budgets
from .routes import oauth_routes
from .database import Base, engine
from . import exceptions
from .config import get_settings

# Load and validate settings (will raise ValueError if config is invalid)
settings = get_settings()

# Crear tablas de la base de datos
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Control de Gastos API",
    description="API moderna para control de gastos personales con autenticación OAuth",
    version="2.1.0"
)

# Registrar manejadores globales de excepciones
exceptions.register_exception_handlers(app)

# Configuración de CORS usando settings
# Allow both production frontend URLs and local development
allowed_origins = [
    settings.frontend_url,
    "https://frontend-production-35fd.up.railway.app",
    "http://localhost:3000",
    "http://localhost:5173",
]

# Remove duplicates while preserving order
seen = set()
unique_origins = []
for origin in allowed_origins:
    if origin and origin not in seen:
        seen.add(origin)
        unique_origins.append(origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=unique_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir enrutadores
app.include_router(auth, prefix="/auth")
app.include_router(oauth_routes.router, prefix="/auth")
app.include_router(expenses, prefix="/expenses")
app.include_router(budgets, prefix="/budgets")

@app.get("/")
def root():
    return {
        "message": "Control de Gastos API v2.1",
        "docs": "/docs",
        "version": "2.1.0"
    }


@app.get("/debug/config")
def debug_config():
    """Debug endpoint to check environment variables."""
    import os
    return {
        "google_client_id": os.getenv("GOOGLE_CLIENT_ID", "NOT_SET"),
        "google_client_secret": os.getenv("GOOGLE_CLIENT_SECRET", "NOT_SET")[:10] + "..." if os.getenv("GOOGLE_CLIENT_SECRET") else "NOT_SET",
        "google_redirect_uri": os.getenv("GOOGLE_REDIRECT_URI", "NOT_SET"),
        "settings_google_client_id": settings.google_client_id or "NOT_SET",
        "settings_google_client_secret": (settings.google_client_secret or "NOT_SET")[:10] + "..." if settings.google_client_secret else "NOT_SET",
    }

@app.get("/health")
def health_check():
    """Health check endpoint for monitoring."""
    return {"status": "healthy", "version": "2.1.0"}
