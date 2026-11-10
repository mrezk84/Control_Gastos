import { antStatus, buildHormiga, simulate, simulatorHint } from './hormiga';

const NOW = new Date(2026, 10, 10); // 10 nov 2026
const e = (description, amount, date, category = 'Alimentación') => ({ description, amount, date, category });

describe('buildHormiga', () => {
  const expenses = [
    e('Café', 95, '2026-11-02'),
    e('café ', 95, '2026-11-03'),
    e('Cafe', 110.5, '2026-11-09'),
    e('Delivery', 280, '2026-11-09'),
    e('Supermercado', 4250.5, '2026-11-08'), // sobre el umbral: no es hormiga
    e('Café', 95, '2026-10-30'), // otro mes
  ];
  const r = buildHormiga(expenses, 300, NOW);

  test('suma solo compras menores al umbral del mes, con centavos', () => {
    expect(r.count).toBe(4);
    expect(r.total).toBe(580.5);
  });

  test('peso sobre el gasto del mes', () => {
    expect(r.sharePct).toBeCloseTo((580.5 / (580.5 + 4250.5)) * 100, 5);
  });

  test('agrupa descripciones sin importar mayúsculas ni tildes y ordena por monto', () => {
    expect(r.top[0]).toMatchObject({ count: 3, amount: 300.5 });
    expect(r.top[1].name).toBe('Delivery');
  });

  test('cuatro semanas y marca la actual', () => {
    expect(r.weeks).toHaveLength(4);
    expect(r.weeks.filter((w) => w.current)).toHaveLength(1);
  });

  test('las descripciones excluidas no cuentan (sin importar tildes)', () => {
    const r2 = buildHormiga(expenses, 300, NOW, ['cafe']);
    expect(r2.count).toBe(1);
    expect(r2.top.map((t) => t.name)).toEqual(['Delivery']);
  });

  test('sin gastos no rompe', () => {
    const empty = buildHormiga([], 300, NOW);
    expect(empty).toMatchObject({ total: 0, count: 0, sharePct: 0, top: [] });
  });
});

describe('antStatus', () => {
  test('niveles', () => {
    expect(antStatus(1000, 3000).level).toBe(0);
    expect(antStatus(2500, 3000).level).toBe(1);
    expect(antStatus(3840, 3000).level).toBe(2);
    expect(antStatus(3840, 3000).left).toBe(-840);
  });
});

describe('simulate', () => {
  test('mensual y anual', () => {
    expect(simulate(1000, 40)).toEqual({ monthly: 400, yearly: 4800 });
    expect(simulate(1000, 150).monthly).toBe(1000);
  });
  test('texto de ayuda por tramo', () => {
    expect(simulatorHint(0, true)).toMatch(/deslizador/);
    expect(simulatorHint(30, true)).toMatch(/punto de partida/);
    expect(simulatorHint(80, true)).toMatch(/Ambicioso/);
    expect(simulatorHint(30, false)).toMatch(/Registra/);
  });
});

import { answer, antIcon, detectIntent, previousMonth, recoveredByChallenge } from './hormiga';

describe('asistente local', () => {
  const money = (n) => `$${n}`;
  const data = buildHormiga([e('Café', 95, '2026-11-02'), e('Café', 95, '2026-11-03'), e('Delivery', 280, '2026-11-09')], 300, NOW);
  const prev = buildHormiga([e('Café', 95, '2026-10-02')], 300, new Date(2026, 9, 10));
  const ctx = { data, prev, threshold: 300, money };

  test('detecta la intención por palabras clave, sin importar tildes', () => {
    expect(detectIntent('¿Qué es un gasto hormiga?')).toBe('que-es');
    expect(detectIntent('Dame un plan sin dejar todo de golpe')).toBe('plan');
    expect(detectIntent('comparame con el mes anterior')).toBe('comparar');
    expect(detectIntent('en qué estoy gastando de más')).toBe('gastando');
    expect(detectIntent('hola qué tal')).toBe('desconocido');
  });

  test('"gastando" arma el ticket con cantidad × promedio', () => {
    const blocks = answer('gastando', ctx);
    const ticket = blocks.find((b) => b.type === 'ticket');
    expect(ticket.rows[0]).toEqual({ label: 'Delivery', value: '1 × $280' });
    expect(ticket.rows[1]).toEqual({ label: 'Café', value: '2 × $95' });
  });

  test('"plan" propone pasos y el botón al plan', () => {
    const blocks = answer('plan', ctx);
    expect(blocks.some((b) => b.type === 'steps')).toBe(true);
    expect(blocks.some((b) => b.type === 'cta')).toBe(true);
  });

  test('sin compras chicas no inventa números', () => {
    const empty = buildHormiga([], 300, NOW);
    const text = answer('gastando', { ...ctx, data: empty }).map((b) => b.text).join(' ');
    expect(text).toMatch(/no veo compras/);
    expect(answer('plan', { ...ctx, data: empty }).some((b) => b.type === 'steps')).toBe(false);
  });

  test('comparar informa la diferencia con el mes anterior', () => {
    const ticket = answer('comparar', ctx).find((b) => b.type === 'ticket');
    expect(ticket.total.value).toBe('$375');
  });

  test('pregunta desconocida: pide probar con las sugeridas', () => {
    expect(answer('hola', ctx)[0].text).toMatch(/Prueba con/);
  });
});

describe('utilidades', () => {
  test('antIcon por palabra clave', () => {
    expect(antIcon('Café con leche')).toBe('coffee');
    expect(antIcon('PedidosYa')).toBe('bicycle');
    expect(antIcon('Spotify')).toBe('repeat');
    expect(antIcon('Algo raro')).toBeNull();
  });
  test('previousMonth ajusta el día', () => {
    expect(previousMonth(new Date(2026, 2, 31)).getDate()).toBe(28);
    expect(previousMonth(new Date(2026, 0, 10)).getFullYear()).toBe(2025);
  });
  test('lo recuperado por el reto', () => {
    expect(recoveredByChallenge(3, 300, 10)).toBe(90);
    expect(recoveredByChallenge(3, 300, 0)).toBe(0);
  });
});
