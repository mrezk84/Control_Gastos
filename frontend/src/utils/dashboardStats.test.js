import { buildDashboard, formatStamp, parseLocalDate } from './dashboardStats';

// Viernes 30 de octubre de 2026
const today = new Date(2026, 9, 30, 20, 0);
const E = (id, date, amount, category, extra = {}) => ({ id, description: `gasto ${id}`, date, amount, category, ...extra });
const weekday = (y, m, d) => ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'][new Date(y, m - 1, d).getDay()];

const list = [
  E(1, '2026-10-30', 38420, 'Alimentación', { created_at: '2026-10-30T21:42:00', receipt_url: '/r' }),
  E(2, '2026-10-30', 5000, 'Transporte'),
  E(3, '2026-10-29', 7999, 'Entretenimiento'),
  E(4, '2026-10-27', 320000, 'Vivienda'),
  E(5, '2026-05-10', 512000, 'Vivienda'),
  E(6, '2026-09-03', 640000, 'Servicios'),
];

describe('buildDashboard', () => {
  const d = buildDashboard(list, today);

  test('totales, promedio y categoría principal', () => {
    expect(d.total).toBe(38420 + 5000 + 7999 + 320000 + 512000 + 640000);
    expect(d.count).toBe(6);
    expect(d.average).toBeCloseTo(d.total / 6);
    expect(d.topCategory).toBe('Vivienda');
    expect(d.categoryCount).toBe(5);
    expect(d.categories[0]).toMatchObject({ name: 'Vivienda', heightPct: 100 });
  });

  test('el mes en curso solo suma octubre y marca el día de hoy', () => {
    expect(d.month.total).toBe(38420 + 5000 + 7999 + 320000);
    expect(d.month.daysInMonth).toBe(31);
    expect(d.month.days).toHaveLength(31);
    expect(d.month.days[29].today).toBe(true);
    expect(d.month.days[30].future).toBe(true);
    expect(d.month.days[26].value).toBe(320000);
  });

  test('tendencia: últimos meses con datos y variación contra el primero', () => {
    expect(d.trend.months.map((m) => m.label)).toEqual(['MAY', 'SEP', 'OCT']);
    expect(d.trend.width).toBe(300);
    expect(d.trend.deltaPct).toBeCloseTo((371419 / 512000 - 1) * 100, 9);
    expect(d.trend.fromLabel).toBe('MAY');
  });

  test('historial agrupado por día, con total del día completo', () => {
    expect(d.groups.map((g) => g.label)).toEqual([
      'HOY',
      'AYER',
      `${weekday(2026, 10, 27)} 27 OCT`,
      `${weekday(2026, 9, 3)} 3 SEP`,
      `${weekday(2026, 5, 10)} 10 MAY`,
    ]);
    expect(d.groups[0].total).toBe(38420 + 5000);
    expect(d.groups[0].items).toHaveLength(2);
  });

  test('el último registro desempata por created_at', () => {
    expect(d.latest.id).toBe(1);
    expect(formatStamp(d.latest, today).startsWith('HOY')).toBe(true);
    expect(formatStamp(list[3], today)).toBe('27 OCT');
  });
});

describe('casos límite', () => {
  test('sin gastos', () => {
    const e = buildDashboard([], today);
    expect(e).toMatchObject({ total: 0, average: 0, topCategory: '—', latest: null });
    expect(e.trend.months).toHaveLength(0);
    expect(e.trend.deltaPct).toBeNull();
  });

  test('un solo mes no produce variación ni puntos inválidos', () => {
    const one = buildDashboard([E(9, '2026-10-01', 1000, 'Salud')], today);
    expect(one.trend.months).toHaveLength(1);
    expect(one.trend.deltaPct).toBeNull();
    const y = parseFloat(one.trend.points.split(' ')[0].split(',')[1]);
    expect(Number.isFinite(y)).toBe(true);
  });

  test('el historial se limita a 20 filas y avisa cuántas quedan', () => {
    const many = Array.from({ length: 30 }, (_, i) => E(100 + i, `2026-10-${String(1 + (i % 28)).padStart(2, '0')}`, 10, 'Otros'));
    const m = buildDashboard(many, today);
    expect(m.groups.reduce((n, g) => n + g.items.length, 0)).toBe(20);
    expect(m.hiddenRows).toBe(10);
  });
});

describe('parseLocalDate', () => {
  test('una fecha sin hora cae en el mismo día local (no se corre por la zona horaria)', () => {
    const d = parseLocalDate('2026-10-30');
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 9, 30]);
  });
});
