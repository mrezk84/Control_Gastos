// Utilidades de formateo - código compartido para evitar duplicación

import { CURRENCY_CONFIG, DATE_CONFIG } from './constants';

/**
 * Convierte a Date. Las fechas "YYYY-MM-DD" (sin hora) se interpretan en hora local:
 * new Date("2026-10-30") las toma como UTC y en zonas al oeste de Greenwich muestra el día anterior.
 */
const toDate = (date) => {
  if (date instanceof Date) return date;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date).trim());
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(date);
};

/**
 * Formatea un valor como moneda ARS
 * @param {number} value - Valor a formatear
 * @returns {string} Valor formateado como moneda
 */
export const formatCurrency = (value) => {
  if (value === null || value === undefined) return '$0';
  return new Intl.NumberFormat('es-AR', CURRENCY_CONFIG).format(value);
};

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
