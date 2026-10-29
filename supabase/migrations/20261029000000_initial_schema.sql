-- Esquema inicial de Control de Gastos para Supabase (PostgreSQL).
-- Ejecutar en Supabase: SQL Editor > New query, o con `supabase db push`.
-- Es idempotente: se puede ejecutar sobre una base vacía o sobre una ya migrada.

create table if not exists public.users (
    id               serial primary key,
    username         varchar(150) unique,
    email            varchar(255) unique,
    supabase_id      varchar(36) unique,
    hashed_password  varchar(255),
    avatar_url       varchar(500),
    auth_provider    varchar(50) default 'email',
    provider_id      varchar(255)
);

-- Para bases migradas desde el esquema anterior
alter table public.users add column if not exists supabase_id varchar(36);
create unique index if not exists ix_users_supabase_id on public.users (supabase_id);
create index if not exists ix_users_username on public.users (username);
create index if not exists ix_users_email on public.users (email);

create table if not exists public.expenses (
    id                  serial primary key,
    description         varchar(255),
    amount              double precision,
    category            varchar(100),
    date                date,
    user_id             integer references public.users (id),
    receipt_url         varchar(500),
    receipt_confidence  double precision,
    created_at          timestamp default now(),
    updated_at          timestamp default now()
);
create index if not exists ix_expenses_id on public.expenses (id);
create index if not exists ix_expenses_user_id on public.expenses (user_id);

create table if not exists public.budgets (
    id            serial primary key,
    user_id       integer references public.users (id),
    category      varchar(100),
    amount        double precision,
    month         integer,
    year          integer,
    is_recurring  boolean default false,
    created_at    timestamp default now()
);
create index if not exists ix_budgets_id on public.budgets (id);
create index if not exists ix_budgets_user_id on public.budgets (user_id);

create table if not exists public.receipt_images (
    id              serial primary key,
    expense_id      integer references public.expenses (id) on delete cascade,
    file_path       varchar(500),
    file_name       varchar(255),
    file_type       varchar(50),
    extracted_data  varchar(2000),
    uploaded_at     timestamp default now()
);
create index if not exists ix_receipt_images_id on public.receipt_images (id);

-- La app accede a estas tablas solo a través del backend (rol postgres, que
-- ignora RLS). Activar RLS sin políticas evita que la API pública de Supabase
-- (PostgREST con la anon key) exponga los datos.
alter table public.users          enable row level security;
alter table public.expenses       enable row level security;
alter table public.budgets        enable row level security;
alter table public.receipt_images enable row level security;
