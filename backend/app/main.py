from fastapi import FastAPI
from .routes import expenses, auth
from .database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Bienvenido a la API de Control de Gastos"}

app.include_router(auth.router)
app.include_router(expenses.router)

