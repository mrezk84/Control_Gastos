// Semáforo del saldo del mes (diseño "Caja registradora"): compara lo gastado con el saldo que la persona fija.

export const DEFAULT_LIMIT = 300000;
export const WARN_PCT = 80;
const STORAGE_KEY = 'saldo';

/** Nivel 0 = dentro del saldo, 1 = cerca del límite (desde WARN_PCT %), 2 = saldo superado. */
export function saldoStatus(monthTotal, limit, warnPct = WARN_PCT) {
  const spent = Number(monthTotal) || 0;
  const cap = Number(limit) || 0;
  const ratio = cap > 0 ? spent / cap : 0;
  const level = ratio > 1 ? 2 : ratio * 100 >= warnPct ? 1 : 0;
  return { level, ratio, left: cap - spent, widthPct: Math.min(100, ratio * 100) };
}

/** Lee el saldo guardado en el navegador; si no hay (o no se puede leer), el predeterminado. */
export function loadLimit() {
  try {
    const n = parseInt(localStorage.getItem(STORAGE_KEY), 10);
    return n > 0 ? n : DEFAULT_LIMIT;
  } catch {
    return DEFAULT_LIMIT;
  }
}

export function saveLimit(value) {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    /* sin almacenamiento: el saldo vale solo para esta sesión */
  }
}

/** "$300.000" o "300000" → 300000; null si no es un número positivo. */
export function parseLimit(text) {
  const n = parseInt(String(text).replace(/\D/g, ''), 10);
  return n > 0 ? n : null;
}
