from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import expenses, auth
from .database import Base, engine
from dotenv import load_dotenv
import os

load_dotenv()  # Load environment variables

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth")
app.include_router(expenses.router, prefix="/expenses")
