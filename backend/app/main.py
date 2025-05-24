from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import expenses, auth
from .database import Base, engine
from dotenv import load_dotenv
import os

load_dotenv()  # Cargar variables de entorno

# Crear tablas de la base de datos
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir enrutadores
app.include_router(auth, prefix="/auth")
app.include_router(expenses, prefix="/expenses")
