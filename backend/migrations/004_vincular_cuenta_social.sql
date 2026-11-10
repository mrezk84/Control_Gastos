-- Vinculación de una identidad social (Google/Microsoft) a una cuenta existente con contraseña.
--
-- Cómo usarlo: Neon → SQL Editor → pega todo este archivo → Run.
-- También sirve:  psql "$DATABASE_URL" -f backend/migrations/004_vincular_cuenta_social.sql
-- Es idempotente. EJECÚTALO ANTES de desplegar el backend nuevo: las columnas nuevas de "oauth_flows" SÍ lo
-- requieren (create_all no agrega columnas a tablas existentes); sin ellas fallan todas las rutas del acceso social
-- (el inicio de sesión con usuario y contraseña no se ve afectado).

alter table oauth_flows add column if not exists link_user_id integer references users (id);
alter table oauth_flows add column if not exists link_subject varchar(255);
