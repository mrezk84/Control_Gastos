// Utilidades de formateo - código compartido para evitar duplicación

import { DATE_CONFIG } from './constants';

/**
 * Convierte a Date. Las fechas "YYYY-MM-DD" (sin hora) se interpretan en hora local:
 * new Date("2026-10-30") las toma como UTC y en zonas al oeste de Greenwich muestra el día anterior.
 */
const toDate = (date) => {
  if (date instanceof Date) return date;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date).trim());
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(date);
};

export const DEFAULT_CURRENCY = 'UYU';

// Igual que backend/app/services/notify.py: los mismos símbolos en pantalla y en los avisos
const SYMBOLS = { UYU: '$', ARS: '$', CLP: '$', COP: '$', MXN: '$', USD: 'US$', EUR: '€', GBP: '£', BRL: 'R$', PEN: 'S/' };

/**
 * "$58.000", "$125,50", "US$1.250,50", "CHF 90": miles con punto y decimales con coma,
 * solo si el monto tiene centavos. Es el único formateador de importes de la app.
 */
export const formatMoney = (value, currency = DEFAULT_CURRENCY) => {
  const n = Number(value) || 0;
  const cents = Math.round(Math.abs(n) * 100) % 100 !== 0;
  const text = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  }).format(Math.abs(n));
  const code = currency || DEFAULT_CURRENCY;
  const symbol = SYMBOLS[code];
  return `${n < 0 ? '-' : ''}${symbol ? symbol : `${code} `}${text}`;
};

/** Compatibilidad: mismo formato que formatMoney (la moneda ya no está fija en ARS). */
export const formatCurrency = (value, currency) => formatMoney(value, currency);

/**
 * Formatea una fecha para mostrar
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} Fecha formateada
 */
export const formatDate = (date) => {
  if (!date) return '-';
  const d = toDate(date);
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('es-AR', DATE_CONFIG).format(d);
};

/**
 * Formatea una fecha para inputs type="date"
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const formatDateForInput = (date) => {
  if (!date) return '';
  const d = toDate(date);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Formatea un número con separadores de miles
 * @param {number} value - Valor a formatear
 * @returns {string} Número formateado
 */
export const formatNumber = (value) => {
  if (value === null || value === undefined) return '0';
  return new Intl.NumberFormat('es-AR').format(value);
};

/**
 * Formatea un porcentaje
 * @param {number} value - Valor a formatear (0-100)
 * @param {number} decimals - Cantidad de decimales (default: 1)
 * @returns {string} Porcentaje formateado
 */
export const formatPercent = (value, decimals = 1) => {
  if (value === null || value === undefined) return '0%';
  return `${value.toFixed(decimals)}%`;
};

/**
 * Trunca texto a una longitud máxima
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} Texto truncado con ... si excede
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/** "$58.000": importe en la moneda dada, como en el Dashboard (centavos solo si los hay). */
export const formatPesos = (value, currency) => formatMoney(value, currency);

/** "$58k" para cifras de mil en adelante; por debajo, el monto entero. */
export const formatK = (value, currency = DEFAULT_CURRENCY) => {
  const n = Number(value) || 0;
  const symbol = SYMBOLS[currency] ?? `${currency} `;
  return n >= 1000 ? `${symbol}${Math.round(n / 1000)}k` : formatMoney(Math.round(n), currency);
};

/** "84,9 %": porcentaje (0-100) con una decimal y coma. */
export const formatShare = (share) => `${(Number(share) || 0).toFixed(1).replace('.', ',')} %`;
