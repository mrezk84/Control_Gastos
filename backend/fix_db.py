from sqlalchemy import create_engine, text
from app.database import SQLALCHEMY_DATABASE_URL

engine = create_engine(SQLALCHEMY_DATABASE_URL)
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'local';"))
        conn.commit()
    except Exception as e:
        print(f"auth_provider: {e}")
        
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN provider_id VARCHAR(255) DEFAULT NULL;"))
        conn.commit()
    except Exception as e:
        print(f"provider_id: {e}")
        
    try:
        # Also let's make sure hashed_password can be NULL, since OAuth users don't have passwords
        conn.execute(text("ALTER TABLE users MODIFY hashed_password VARCHAR(255) NULL;"))
        conn.commit()
    except Exception as e:
        print(f"hashed_password mod: {e}")

print("Done updating schema.")
