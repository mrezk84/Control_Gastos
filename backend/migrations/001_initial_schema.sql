-- Esquema inicial de Control de Gastos (PostgreSQL estándar, probado en Neon).
-- Ejecutar en Neon: SQL Editor, o `psql "$DATABASE_URL" -f migrations/001_initial_schema.sql`.
-- Es idempotente: se puede ejecutar sobre una base vacía o sobre una ya migrada.
-- (La app también crea las tablas faltantes al arrancar con Base.metadata.create_all,
--  pero NO agrega columnas a tablas existentes: por eso los ALTER de abajo.)

create table if not exists users (
    id               serial primary key,
    username         varchar(150) unique,
    email            varchar(255) unique,
    supabase_id      varchar(36) unique,   -- sin uso desde que se dejó Supabase; se conserva por compatibilidad
    hashed_password  varchar(255),         -- null en cuentas creadas con Google/Microsoft
    avatar_url       varchar(500),
    auth_provider    varchar(50) default 'local',
    provider_id      varchar(255)
);
create index if not exists ix_users_username on users (username);
create index if not exists ix_users_email on users (email);

create table if not exists expenses (
    id                  serial primary key,
    description         varchar(255),
    amount              double precision,
    category            varchar(100),
    date                date,
    user_id             integer references users (id),
    receipt_url         varchar(500),
    receipt_confidence  double precision,
    created_at          timestamp default now(),
    updated_at          timestamp default now()
);
create index if not exists ix_expenses_id on expenses (id);
create index if not exists ix_expenses_user_id on expenses (user_id);

create table if not exists budgets (
    id            serial primary key,
    user_id       integer references users (id),
    category      varchar(100),
    amount        double precision,
    month         integer,
    year          integer,
    is_recurring  boolean default false,
    created_at    timestamp default now()
);
create index if not exists ix_budgets_id on budgets (id);
create index if not exists ix_budgets_user_id on budgets (user_id);

create table if not exists receipt_images (
    id              serial primary key,
    expense_id      integer references expenses (id) on delete cascade,
    file_path       varchar(500),          -- legado (disco local); los recibos nuevos viven en "content"
    file_name       varchar(255),
    file_type       varchar(50),
    extracted_data  varchar(2000),
    uploaded_at     timestamp default now(),
    content         bytea
);
create index if not exists ix_receipt_images_id on receipt_images (id);

-- Para bases creadas con el esquema anterior (Supabase)
alter table receipt_images add column if not exists content bytea;
alter table users alter column auth_provider set default 'local';
