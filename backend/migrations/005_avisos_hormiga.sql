-- Avisos de gastos hormiga: preferencias de cada persona en "users".
--
-- Cómo usarlo: Neon → SQL Editor → pega todo este archivo → Run.
-- También sirve:  psql "$DATABASE_URL" -f backend/migrations/005_avisos_hormiga.sql
-- Es idempotente. EJECÚTALO ANTES de desplegar el backend nuevo: create_all no agrega columnas a tablas
-- existentes, y sin estas fallan todas las lecturas de usuarios.
--
--   ant_threshold  umbral manual (menor a este monto es "compra chica"); null = automático, se adapta a la persona
--   ant_limit      tope mensual de compras chicas; null = sin tope
--   ant_notify     si quiere que se le avise al detectar un patrón
--   ant_excluded   descripciones que la persona marcó como "esto no es hormiga" (lista JSON, normalizadas)

alter table users add column if not exists ant_threshold double precision;
alter table users add column if not exists ant_limit double precision;
alter table users add column if not exists ant_notify boolean not null default true;
alter table users add column if not exists ant_excluded text;
