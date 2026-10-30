-- Control de Gastos: esquema inicial (PostgreSQL, probado para Neon).
--
-- Cómo usarlo: Neon → SQL Editor → pega todo este archivo → Run.
-- También sirve:  psql "$DATABASE_URL" -f backend/migrations/001_initial_schema.sql
--
-- Es idempotente (se puede ejecutar más de una vez) y equivale a lo que crea la app al arrancar
-- con Base.metadata.create_all. OJO: create_all NO agrega columnas a tablas que ya existen; por eso
-- las sentencias ALTER del final, para bases creadas con una versión anterior.

create table if not exists users (
    id               serial primary key,
    username         varchar(150),
    email            varchar(255),
    supabase_id      varchar(36),               -- sin uso desde que se dejó Supabase; se conserva por compatibilidad
    hashed_password  varchar(255),              -- null en cuentas creadas con Google o Microsoft
    avatar_url       varchar(500),
    auth_provider    varchar(50) default 'local',
    provider_id      varchar(255)
);
create unique index if not exists ix_users_username    on users (username);
create unique index if not exists ix_users_email       on users (email);
create unique index if not exists ix_users_supabase_id on users (supabase_id);
create index        if not exists ix_users_id          on users (id);

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
create index if not exists ix_expenses_id      on expenses (id);
create index if not exists ix_expenses_user_id on expenses (user_id);  -- extra: acelera "mis gastos"

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
create index if not exists ix_budgets_id      on budgets (id);
create index if not exists ix_budgets_user_id on budgets (user_id);

create table if not exists receipt_images (
    id              serial primary key,
    expense_id      integer references expenses (id),
    file_path       varchar(500),               -- legado (disco local); los recibos nuevos viven en "content"
    file_name       varchar(255),
    file_type       varchar(50),                -- 'image' o 'pdf'
    extracted_data  varchar(2000),
    uploaded_at     timestamp default now(),
    content         bytea                       -- el archivo (el disco de Vercel es efímero)
);
create index if not exists ix_receipt_images_id on receipt_images (id);

-- Para bases creadas con una versión anterior del esquema (no hacen nada si ya está al día)
alter table receipt_images add column if not exists content bytea;
alter table receipt_images alter column file_path drop not null;
