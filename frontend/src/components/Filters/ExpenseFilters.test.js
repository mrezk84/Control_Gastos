import { presetRange } from './ExpenseFilters';

// Jueves 12 de noviembre de 2026, de noche: toISOString() ya daría el día 13 en UTC-3
const now = new Date(2026, 10, 12, 23, 30);

describe('presetRange', () => {
  test('"Todo" no limita fechas', () => {
    expect(presetRange('all', now)).toEqual({ startDate: '', endDate: '' });
  });

  test('"Hoy" usa el día local', () => {
    expect(presetRange('today', now)).toEqual({ startDate: '2026-11-12', endDate: '2026-11-12' });
  });

  test('"7 días" incluye hoy y los seis días anteriores', () => {
    expect(presetRange('week', now)).toEqual({ startDate: '2026-11-06', endDate: '2026-11-12' });
  });

  test('"Este mes" va del día 1 a hoy', () => {
    expect(presetRange('month', now)).toEqual({ startDate: '2026-11-01', endDate: '2026-11-12' });
  });

  test('"Mes anterior" cubre el mes completo', () => {
    expect(presetRange('lastMonth', now)).toEqual({ startDate: '2026-10-01', endDate: '2026-10-31' });
  });

  test('"Mes anterior" en enero cae en diciembre del año pasado', () => {
    expect(presetRange('lastMonth', new Date(2026, 0, 15))).toEqual({ startDate: '2025-12-01', endDate: '2025-12-31' });
  });

  test('"Este año" va del 1 de enero a hoy', () => {
    expect(presetRange('year', now)).toEqual({ startDate: '2026-01-01', endDate: '2026-11-12' });
  });
});
