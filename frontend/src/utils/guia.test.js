import { buildSteps, progress, CURRENCIES } from './guia';

describe('guía de datos generales', () => {
  test('sin nada cargado, el primer paso es la moneda', () => {
    const p = progress(buildSteps({ user: {}, expenseCount: 0, budgetCount: 0, saldoSet: false }));
    expect(p).toMatchObject({ done: 0, total: 4, complete: false });
    expect(p.next.id).toBe('moneda');
  });

  test('marca como hechos los pasos con datos y salta al siguiente pendiente', () => {
    const p = progress(buildSteps({ user: { currency: 'UYU' }, expenseCount: 3, budgetCount: 0, saldoSet: false }));
    expect(p.done).toBe(2);
    expect(p.next.id).toBe('saldo');
  });

  test('con todo cargado está completa y no hay siguiente', () => {
    const p = progress(buildSteps({ user: { currency: 'USD' }, expenseCount: 1, budgetCount: 1, saldoSet: true }));
    expect(p).toMatchObject({ done: 4, complete: true, next: null });
  });

  test('las monedas ofrecidas incluyen la de cada país con su código', () => {
    expect(CURRENCIES.find((c) => c.code === 'UYU').country).toBe('UY');
  });
});
