import { DEFAULT_LIMIT, loadLimit, parseLimit, saldoStatus, saveLimit } from './saldo';

describe('semáforo del saldo', () => {
  test('dentro del saldo por debajo del umbral', () => {
    const s = saldoStatus(100000, 300000);
    expect(s.level).toBe(0);
    expect(s.left).toBe(200000);
    expect(s.widthPct).toBeCloseTo(33.3, 1);
  });

  test('cerca del límite desde el 80 %', () => {
    expect(saldoStatus(239999, 300000).level).toBe(0);
    expect(saldoStatus(240000, 300000).level).toBe(1);
    expect(saldoStatus(300000, 300000).level).toBe(1);
  });

  test('saldo superado: la barra no pasa del 100 % y el faltante es negativo', () => {
    const s = saldoStatus(330000, 300000);
    expect(s.level).toBe(2);
    expect(s.widthPct).toBe(100);
    expect(s.left).toBe(-30000);
  });

  test('sin saldo válido no explota', () => {
    expect(saldoStatus(500, 0).level).toBe(0);
    expect(saldoStatus(undefined, 1000).ratio).toBe(0);
  });

  test('parseLimit acepta texto con formato y rechaza lo no positivo', () => {
    expect(parseLimit('$350.000')).toBe(350000);
    expect(parseLimit('abc')).toBeNull();
    expect(parseLimit('0')).toBeNull();
  });

  test('guardar y leer el saldo; sin nada guardado usa el predeterminado', () => {
    localStorage.clear();
    expect(loadLimit()).toBe(DEFAULT_LIMIT);
    saveLimit(450000);
    expect(loadLimit()).toBe(450000);
  });
});
