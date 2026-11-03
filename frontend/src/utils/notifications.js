// Utilidades de las notificaciones de la app.

/** El backend entrega fechas UTC sin zona ("2026-11-03T15:00:00"): se interpretan como UTC. */
export function parseUtc(value) {
  if (!value) return null;
  const s = String(value);
  return new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(s) ? s : `${s}Z`);
}

/** 'ahora', 'hace 5 min', 'hace 3 h', 'hace 2 d'. */
export function timeAgo(value, now = Date.now()) {
  const d = parseUtc(value);
  if (!d || Number.isNaN(d.getTime())) return '';
  const min = Math.floor((now - d.getTime()) / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  if (min < 1440) return `hace ${Math.floor(min / 60)} h`;
  return `hace ${Math.floor(min / 1440)} d`;
}

/** La app no tiene página en '/': los avisos del servidor apuntan al panel. */
export const linkFor = (link) => (!link || link === '/' ? '/dashboard' : link);

export const KIND_ICON = {
  due_soon: 'ph-duotone ph-clock',
  due_today: 'ph-duotone ph-calendar-check',
  overdue: 'ph-duotone ph-warning',
  payment_registered: 'ph-duotone ph-receipt',
};
