-- Correcciones de la auditoría de seguridad (docs/security/AUDITORIA.md): revocación de sesiones,
-- enlaces de recuperación de un solo uso, transacciones de acceso social y limitador de intentos.
--
-- Cómo usarlo: Neon → SQL Editor → pega todo este archivo → Run.
-- También sirve:  psql "$DATABASE_URL" -f backend/migrations/003_seguridad.sql
-- Es idempotente. EJECÚTALO ANTES de desplegar el backend nuevo: la columna nueva de "users" SÍ lo
-- requiere (create_all no agrega columnas a tablas existentes) y sin ella fallan todas las lecturas de usuarios.
-- Las tablas nuevas también las crea Base.metadata.create_all al arrancar.

alter table users add column if not exists token_version integer not null default 0;

create table if not exists password_reset_tokens (
    id          serial primary key,
    user_id     integer references users (id),
    token_hash  varchar(64) unique,     -- SHA-256 del token; el token en claro solo viaja por correo
    expires_at  timestamp,
    used_at     timestamp,
    created_at  timestamp default now()
);
create index if not exists ix_password_reset_tokens_id      on password_reset_tokens (id);
create index if not exists ix_password_reset_tokens_user_id on password_reset_tokens (user_id);
create unique index if not exists ix_password_reset_tokens_token_hash on password_reset_tokens (token_hash);

create table if not exists oauth_flows (
    id                serial primary key,
    state_hash        varchar(64) unique,
    provider          varchar(20),
    challenge         varchar(64),
    provider_verifier varchar(128),
    expires_at        timestamp,
    state_used_at     timestamp,
    code_hash         varchar(64) unique,
    code_expires_at   timestamp,
    code_used_at      timestamp,
    user_id           integer references users (id),
    created_at        timestamp default now()
);
create index if not exists ix_oauth_flows_id         on oauth_flows (id);
create unique index if not exists ix_oauth_flows_state_hash on oauth_flows (state_hash);
create unique index if not exists ix_oauth_flows_code_hash  on oauth_flows (code_hash);

create table if not exists rate_limit_hits (
    id          serial primary key,
    key         varchar(255),
    created_at  timestamp default now()
);
create index if not exists ix_rate_limit_hits_id         on rate_limit_hits (id);
create index if not exists ix_rate_limit_hits_key        on rate_limit_hits (key);
create index if not exists ix_rate_limit_hits_created_at on rate_limit_hits (created_at);
