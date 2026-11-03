from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import expenses, auth, budgets, oauth
from .routes import receipts, reminders, notifications, push, cron
from .database import Base, engine
from .frontend_url import frontend_urls
from dotenv import load_dotenv

load_dotenv()

# Crear tablas de la base de datos
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Control de Gastos API",
    description="API moderna para control de gastos personales con autenticación JWT y escaneo de recibos",
    version="2.1.0"
)

# Configuración de CORS
# FRONTEND_URL admite varias URLs separadas por coma (producción y previews)
FRONTEND_URLS = frontend_urls()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        *FRONTEND_URLS,
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
app.include_router(receipts, prefix="/receipts")
app.include_router(budgets, prefix="/budgets")
app.include_router(reminders, prefix="/reminders")
app.include_router(notifications, prefix="/notifications")
app.include_router(push, prefix="/push")
app.include_router(cron, prefix="/cron")

@app.get("/")
def root():
    return {"message": "Control de Gastos API v2.1", "docs": "/docs"}
