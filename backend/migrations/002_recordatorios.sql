-- Recordatorios de pago, notificaciones y perfil regional (país, moneda, zona horaria).
-- Spec: docs/specs/recordatorios.md
--
-- Cómo usarlo: Neon → SQL Editor → pega todo este archivo → Run.
-- También sirve:  psql "$DATABASE_URL" -f backend/migrations/002_recordatorios.sql
-- Es idempotente. Equivale a lo que crea Base.metadata.create_all para las tablas nuevas; las columnas
-- nuevas de "users" SÍ requieren este script (create_all no agrega columnas a tablas existentes).

alter table users add column if not exists country  varchar(2);    -- ISO 3166-1 alfa-2 (si falta, UY)
alter table users add column if not exists currency varchar(3);    -- ISO 4217 (si falta, UYU)
alter table users add column if not exists timezone varchar(64);   -- IANA (si falta, America/Montevideo)

create table if not exists payment_reminders (
    id                  serial primary key,
    user_id             integer references users (id),
    description         varchar(255),
    amount              double precision,
    category            varchar(100),
    due_date            date,
    source              varchar(10) default 'manual',   -- ocr | qr | manual
    status              varchar(10) default 'pending',  -- pending | paid | dismissed
    expense_id          integer references expenses (id),
    last_notified_kind  varchar(20),
    last_notified_on    date,
    created_at          timestamp default now()
);
create index if not exists ix_payment_reminders_id      on payment_reminders (id);
create index if not exists ix_payment_reminders_user_id on payment_reminders (user_id);
create index if not exists ix_payment_reminders_status  on payment_reminders (status);

create table if not exists notifications (
    id          serial primary key,
    user_id     integer references users (id),
    kind        varchar(20),    -- due_soon | due_today | overdue | payment_registered
    title       varchar(255),
    body        varchar(500),
    link        varchar(255),
    read_at     timestamp,
    created_at  timestamp default now()
);
create index if not exists ix_notifications_id      on notifications (id);
create index if not exists ix_notifications_user_id on notifications (user_id);

create table if not exists push_subscriptions (
    id          serial primary key,
    user_id     integer references users (id),
    endpoint    varchar(1000),
    p256dh      varchar(255),
    auth        varchar(255),
    created_at  timestamp default now()
);
create index        if not exists ix_push_subscriptions_id       on push_subscriptions (id);
create index        if not exists ix_push_subscriptions_user_id  on push_subscriptions (user_id);
create unique index if not exists ix_push_subscriptions_endpoint on push_subscriptions (endpoint);
