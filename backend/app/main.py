from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import expenses, auth, oauth
from .database import Base, engine
from dotenv import load_dotenv
import os

load_dotenv()

# Crear tablas de la base de datos
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Control de Gastos API",
    description="API moderna para control de gastos personales con autenticación OAuth",
    version="2.0.0"
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

# Incluir enrutadores
app.include_router(auth, prefix="/auth")
app.include_router(oauth, prefix="/auth")
app.include_router(expenses, prefix="/expenses")

@app.get("/")
def root():
    return {"message": "Control de Gastos API v2.0", "docs": "/docs"}
