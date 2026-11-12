import { formatDate, formatDateForInput, formatDateShort, formatPesos, formatK, formatShare, formatMoney } from './formatters';

describe('fechas de solo día', () => {
  // new Date("2026-10-30") se interpreta en UTC y, al oeste de Greenwich, mostraba el día 29.
  test('formatDate da el mismo resultado que construir la fecha en hora local', () => {
    expect(formatDate('2026-10-30')).toBe(formatDate(new Date(2026, 9, 30)));
  });

  test('formatDate incluye el día correcto', () => {
    expect(formatDate('2026-10-30')).toMatch(/\b30\b/);
  });

  test('formatDateForInput devuelve la misma fecha', () => {
    expect(formatDateForInput('2026-10-30')).toBe('2026-10-30');
    expect(formatDateForInput(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  test('valores vacíos o inválidos', () => {
    expect(formatDate(null)).toBe('-');
    expect(formatDate('no-es-fecha')).toBe('-');
    expect(formatDateForInput('')).toBe('');
  });
});

describe('formato del Dashboard', () => {
  test('formatPesos: sin espacio; centavos solo si los hay', () => {
    expect(formatPesos(58000)).toBe('$58.000');
    expect(formatPesos(125.5)).toBe('$125,50');
    expect(formatPesos(1234567.6)).toBe('$1.234.567,60');
    expect(formatPesos(0)).toBe('$0');
    expect(formatPesos(null)).toBe('$0');
  });

  test('formatK: miles abreviados y montos pequeños enteros', () => {
    expect(formatK(58000)).toBe('$58k');
    expect(formatK(1720000)).toBe('$1720k');
    expect(formatK(950)).toBe('$950');
  });

  test('formatShare: una decimal con coma y espacio antes del %', () => {
    expect(formatShare(84.857)).toBe('84,9 %');
    expect(formatShare(0)).toBe('0,0 %');
  });
});

describe('formatMoney: una sola moneda, la del perfil', () => {
  test('símbolo según la moneda y UYU por defecto', () => {
    expect(formatMoney(1250.5, 'USD')).toBe('US$1.250,50');
    expect(formatMoney(90, 'CHF')).toBe('CHF 90');
    expect(formatMoney(3000)).toBe('$3.000');
    expect(formatMoney(3000, 'EUR')).toBe('€3.000');
  });

  test('conserva los centavos y no los inventa', () => {
    expect(formatMoney(125.5)).toBe('$125,50');
    expect(formatMoney(125)).toBe('$125');
    expect(formatMoney(-40.25)).toBe('-$40,25');
  });

  test('formatK respeta la moneda', () => {
    expect(formatK(58000, 'USD')).toBe('US$58k');
  });
});

describe('formatDateShort', () => {
  const now = new Date(2026, 10, 12);

  test('omite el año cuando es el actual', () => {
    expect(formatDateShort('2026-11-03', now)).toBe('3 nov');
  });

  test('incluye el año cuando es otro', () => {
    expect(formatDateShort('2025-12-31', now)).toBe('31 dic 2025');
  });

  test('una fecha vacía o inválida muestra un guion', () => {
    expect(formatDateShort('', now)).toBe('-');
    expect(formatDateShort('no-es-fecha', now)).toBe('-');
  });
});
