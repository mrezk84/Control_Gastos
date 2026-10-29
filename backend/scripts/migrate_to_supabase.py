"""
Migra los datos de la base anterior (MySQL / PostgreSQL de Render/Railway) a Supabase.

1. Copia users, expenses, budgets y receipt_images conservando los ids.
2. Crea cada usuario en Supabase Auth (conservando su contraseña bcrypt, así puede
   seguir entrando con el mismo email y contraseña) y guarda su supabase_id.

Antes de ejecutarlo, aplicá supabase/migrations/*.sql en el proyecto de Supabase.

Uso (desde backend/):
    export DATABASE_URL="postgresql://postgres.<ref>:<pass>@aws-0-<region>.pooler.supabase.com:5432/postgres"
    export SUPABASE_URL="https://<ref>.supabase.co"
    export SUPABASE_SERVICE_ROLE_KEY="<service_role key>"   # nunca en el frontend
    python -m scripts.migrate_to_supabase --source "mysql+pymysql://user:pass@host/control_gastos"

Para una base MySQL de origen hace falta `pip install pymysql`.
Usá --skip-data si los datos ya están copiados y solo querés crear los usuarios en Auth.
"""

import argparse
import os
import sys

import httpx
from sqlalchemy import MetaData, create_engine, select, text

from app.database import Base, engine as target_engine
from app import models  # noqa: F401  (registers the tables in Base.metadata)

TABLES = ["users", "expenses", "budgets", "receipt_images"]


def copy_data(source_url: str) -> None:
    if source_url.startswith("postgres://"):
        source_url = source_url.replace("postgres://", "postgresql://", 1)
    if source_url.startswith("mysql://"):
        source_url = source_url.replace("mysql://", "mysql+pymysql://", 1)

    source_engine = create_engine(source_url)
    source_meta = MetaData()
    source_meta.reflect(bind=source_engine)

    with source_engine.connect() as src, target_engine.begin() as dst:
        for name in TABLES:
            if name not in source_meta.tables:
                print(f"- {name}: no existe en el origen, se omite")
                continue
            src_table = source_meta.tables[name]
            dst_table = Base.metadata.tables[name]
            columns = [c.name for c in dst_table.columns if c.name in src_table.columns]

            rows = [dict(r) for r in src.execute(select(*[src_table.c[c] for c in columns])).mappings()]
            existing = {r[0] for r in dst.execute(select(dst_table.c.id))}
            rows = [r for r in rows if r["id"] not in existing]
            if rows:
                dst.execute(dst_table.insert(), rows)

            # Keep the serial sequence ahead of the copied ids
            dst.execute(text(
                f"select setval(pg_get_serial_sequence('public.{name}', 'id'), "
                f"coalesce((select max(id) from public.{name}), 0) + 1, false)"
            ))
            print(f"- {name}: {len(rows)} filas copiadas")


def _admin_client() -> httpx.Client:
    url = os.environ["SUPABASE_URL"].rstrip("/")
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return httpx.Client(
        base_url=f"{url}/auth/v1/admin",
        headers={"apikey": key, "Authorization": f"Bearer {key}"},
        timeout=30,
    )


def _existing_auth_users(client: httpx.Client) -> dict:
    """Map email -> Supabase user id for users already in Supabase Auth."""
    users, page = {}, 1
    while True:
        resp = client.get("/users", params={"page": page, "per_page": 1000})
        resp.raise_for_status()
        batch = resp.json().get("users", [])
        for u in batch:
            if u.get("email"):
                users[u["email"].lower()] = u["id"]
        if len(batch) < 1000:
            return users
        page += 1


def create_auth_users() -> None:
    with _admin_client() as client, target_engine.begin() as db:
        existing = _existing_auth_users(client)
        rows = db.execute(text(
            "select id, username, email, hashed_password from public.users where supabase_id is null"
        )).mappings().all()

        for row in rows:
            email = (row["email"] or "").lower()
            if not email:
                print(f"! usuario {row['username']} sin email, se omite")
                continue

            supabase_id = existing.get(email)
            if not supabase_id:
                payload = {
                    "email": email,
                    "email_confirm": True,
                    "user_metadata": {"username": row["username"]},
                }
                if row["hashed_password"] and row["hashed_password"].startswith("$2"):
                    payload["password_hash"] = row["hashed_password"]
                resp = client.post("/users", json=payload)
                if resp.status_code >= 400:
                    print(f"! {email}: {resp.status_code} {resp.text}")
                    continue
                supabase_id = resp.json()["id"]

            db.execute(
                text("update public.users set supabase_id = :sid where id = :id"),
                {"sid": supabase_id, "id": row["id"]},
            )
            print(f"- {email} -> {supabase_id}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--source", help="URL de la base de datos anterior")
    parser.add_argument("--skip-data", action="store_true", help="No copiar tablas, solo crear usuarios en Auth")
    args = parser.parse_args()

    if not args.skip_data:
        if not args.source:
            parser.error("--source es obligatorio salvo con --skip-data")
        print("Copiando datos...")
        copy_data(args.source)

    print("Creando usuarios en Supabase Auth...")
    create_auth_users()
    print("Listo.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
