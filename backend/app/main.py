from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from .routes import expenses, auth, budgets
from .routes.oauth_routes import router as oauth
from .routes import receipts
from .database import Base, engine
from dotenv import load_dotenv
import os

load_dotenv()

# Crear tablas de la base de datos
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Control de Gastos API",
    description="API moderna para control de gastos personales con autenticación OAuth y escaneo de recibos",
    version="2.1.0"
)

# Configuración de CORS
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Crear directorio de uploads si no existe
uploads_dir = Path("uploads/receipts")
uploads_dir.mkdir(parents=True, exist_ok=True)

# Incluir enrutadores
app.include_router(auth, prefix="/auth")
app.include_router(oauth, prefix="/auth")
app.include_router(expenses, prefix="/expenses")
app.include_router(receipts, prefix="/receipts")
app.include_router(budgets.router, prefix="/budgets")

@app.get("/")
def root():
    return {"message": "Control de Gastos API v2.1", "docs": "/docs"}
