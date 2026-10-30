import { formatDate, formatDateForInput, formatPesos, formatK, formatShare } from './formatters';

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
  test('formatPesos: sin espacio ni decimales', () => {
    expect(formatPesos(58000)).toBe('$58.000');
    expect(formatPesos(1234567.6)).toBe('$1.234.568');
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
