from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .routes import expenses, auth, budgets, oauth
from .routes import receipts, reminders, notifications, push, cron, hormiga
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

# Tope del cuerpo de cualquier petición (Vercel ya rechaza más de 4,5 MB; esto cubre otros despliegues)
MAX_BODY_BYTES = 5 * 1024 * 1024


@app.middleware("http")
async def limit_body_size(request: Request, call_next):
    declared = request.headers.get("content-length")
    if declared and declared.isdigit() and int(declared) > MAX_BODY_BYTES:
        return JSONResponse(status_code=413, content={"detail": "La petición es demasiado grande"})
    return await call_next(request)


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
    expose_headers=["X-Total-Count"],
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
app.include_router(hormiga, prefix="/hormiga")

@app.get("/")
def root():
    return {"message": "Control de Gastos API v2.1", "docs": "/docs"}
