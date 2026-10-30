import { formatDate, formatDateForInput } from './formatters';

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
