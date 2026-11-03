// Reglas del escaneo de facturas: ¿ya está pagada o queda pendiente? (docs/specs/recordatorios.md)

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Hoy como aaaa-mm-dd en hora local. */
export const todayISO = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** 'pending' si el vencimiento es posterior a hoy; en cualquier otro caso, 'paid'. */
export const classifyScan = (dueDate, today = todayISO()) =>
  typeof dueDate === 'string' && ISO.test(dueDate) && dueDate > today ? 'pending' : 'paid';

const utcDay = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

/** Días que faltan para una fecha ISO (negativo si ya pasó). */
export const daysUntil = (dueISO, today = todayISO()) => Math.round((utcDay(dueISO) - utcDay(today)) / 86400000);

/** 'vence hoy', 'vence en 3 días', 'venció hace 2 días'... */
export function dueText(days) {
  if (days === 0) return 'vence hoy';
  if (days === 1) return 'vence mañana';
  if (days > 1) return `vence en ${days} días`;
  if (days === -1) return 'venció ayer';
  return `venció hace ${-days} días`;
}

/** '2026-11-15' → '15/11' */
export const shortDate = (iso) => (ISO.test(iso || '') ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : '');
