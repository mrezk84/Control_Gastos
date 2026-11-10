// Asistente guía: lleva a la persona por los datos generales que necesita la app (sin servidor, solo lee).
import { loadLimit } from './saldo';

const KEY_HIDDEN = 'guia.oculta';
export const CURRENCIES = [
  { code: 'UYU', label: 'Peso uruguayo (UYU)', country: 'UY' },
  { code: 'ARS', label: 'Peso argentino (ARS)', country: 'AR' },
  { code: 'CLP', label: 'Peso chileno (CLP)', country: 'CL' },
  { code: 'COP', label: 'Peso colombiano (COP)', country: 'CO' },
  { code: 'MXN', label: 'Peso mexicano (MXN)', country: 'MX' },
  { code: 'PEN', label: 'Sol peruano (PEN)', country: 'PE' },
  { code: 'BRL', label: 'Real brasileño (BRL)', country: 'BR' },
  { code: 'USD', label: 'Dólar (USD)', country: 'US' },
  { code: 'EUR', label: 'Euro (EUR)', country: 'ES' },
  { code: 'GBP', label: 'Libra (GBP)', country: 'GB' },
];

/** ¿La persona fijó su saldo alguna vez? (`loadLimit` devuelve un valor por defecto si no). */
export function hasStoredLimit() {
  try {
    return parseInt(localStorage.getItem('saldo'), 10) > 0;
  } catch {
    return false;
  }
}

/**
 * Pasos de datos generales, en orden. `done` sale de lo que ya hay cargado.
 * Cada paso dice qué hacer (`action`) para que la interfaz sepa a dónde llevar.
 */
export function buildSteps({ user, expenseCount, budgetCount, saldoSet }) {
  return [
    {
      id: 'moneda',
      title: 'Tu moneda',
      text: 'Elige la moneda en la que llevas tus gastos. Así todos los importes salen en la tuya.',
      done: Boolean(user?.currency),
      action: { kind: 'currency', label: 'Guardar moneda' },
    },
    {
      id: 'saldo',
      title: 'Tu saldo del mes',
      text: 'Dime cuánto quieres gastar como máximo este mes y te aviso antes de pasarte.',
      done: Boolean(saldoSet),
      action: { kind: 'saldo', label: 'Fijar mi saldo' },
    },
    {
      id: 'gasto',
      title: 'Tu primer gasto',
      text: 'Registra una compra de hoy, aunque sea chica. Con el primero ya ves tu panel.',
      done: expenseCount > 0,
      action: { kind: 'register', label: 'Registrar un gasto' },
    },
    {
      id: 'presupuesto',
      title: 'Un presupuesto',
      text: 'Ponle un tope a una categoría, por ejemplo Alimentación, y sigo cuánto te queda.',
      done: budgetCount > 0,
      action: { kind: 'route', to: '/budgets', label: 'Crear presupuesto' },
    },
  ];
}

export function progress(steps) {
  const done = steps.filter((s) => s.done).length;
  return { done, total: steps.length, next: steps.find((s) => !s.done) || null, complete: done === steps.length };
}

export const wasHidden = () => {
  try {
    return localStorage.getItem(KEY_HIDDEN) === '1';
  } catch {
    return false;
  }
};
export const hideGuide = () => {
  try {
    localStorage.setItem(KEY_HIDDEN, '1');
  } catch {
    /* sin almacenamiento: se oculta solo en esta visita */
  }
};
export { loadLimit };
