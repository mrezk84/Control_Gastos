from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

# Cargar variables del entorno desde .env
load_dotenv()

# Obtener variables
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT", "3306")  # Valor por defecto si no está definido
DB_NAME = os.getenv("DB_NAME")

# Validar que ninguna sea None
missing_vars = [var for var, name in [(DB_USER, "DB_USER"), (DB_PASS, "DB_PASS"), (DB_HOST, "DB_HOST"), (DB_NAME, "DB_NAME")] if not var]
if missing_vars:
    raise ValueError(f"❌ Faltan las siguientes variables de entorno: {', '.join(name for _, name in [(DB_USER, 'DB_USER'), (DB_PASS, 'DB_PASS'), (DB_HOST, 'DB_HOST'), (DB_NAME, 'DB_NAME')] if not _)}")

# Construir la URL de conexión
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Crear engine y sesión
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependencia para usar en rutas
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# (Opcional) Test de conexión
if __name__ == "__main__":
    try:
        with engine.connect() as connection:
            print("✅ Conexión exitosa a la base de datos.")
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
