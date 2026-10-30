// Cálculos puros del Dashboard (sin React) a partir de la lista de gastos.
// Ver docs/design/screens.md para la definición de cada dato.

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MONTHS_SHORT = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const WEEKDAYS_SHORT = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export const MAX_HISTORY_ROWS = 20;
export const TOP_CATEGORIES = 6;
export const TREND_MONTHS = 6;

/** "YYYY-MM-DD" → Date local (new Date(str) lo interpretaría en UTC y correría el día). */
export const parseLocalDate = (value) => {
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const dayKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** El backend guarda created_at en UTC sin zona; se interpreta como UTC. */
export const parseCreatedAt = (value) => {
  if (!value) return null;
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(value);
  const date = new Date(hasZone ? value : `${value}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const sortKey = (expense) => {
  const created = parseCreatedAt(expense.created_at);
  return [parseLocalDate(expense.date).getTime(), created ? created.getTime() : 0, expense.id || 0];
};

const compareDesc = (a, b) => {
  const ka = sortKey(a);
  const kb = sortKey(b);
  for (let i = 0; i < ka.length; i += 1) {
    if (ka[i] !== kb[i]) return kb[i] - ka[i];
  }
  return 0;
};

const groupLabel = (date, today) => {
  const diff = Math.round((new Date(today.getFullYear(), today.getMonth(), today.getDate()) - date) / 86400000);
  if (diff === 0) return 'HOY';
  if (diff === 1) return 'AYER';
  return `${WEEKDAYS_SHORT[date.getDay()]} ${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
};

const longDate = (date) =>
  `${WEEKDAYS[date.getDay()]} ${date.getDate()} de ${MONTHS[date.getMonth()].toLowerCase()} de ${date.getFullYear()}`;

/**
 * @param {Array<{id:number, amount:number, category:string, date:string, description:string, receipt_url?:string, created_at?:string}>} expenses
 * @param {Date} [today]
 */
export function buildDashboard(expenses, today = new Date()) {
  const list = Array.isArray(expenses) ? expenses : [];
  const total = list.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const count = list.length;

  // --- categorías ---
  const byCategory = {};
  list.forEach((e) => {
    const name = e.category || 'Otros';
    byCategory[name] = (byCategory[name] || 0) + (Number(e.amount) || 0);
  });
  const sorted = Object.entries(byCategory)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);
  const maxCategory = sorted.length ? sorted[0].amount : 0;
  const categories = sorted.slice(0, TOP_CATEGORIES).map((c) => ({
    ...c,
    share: total ? (c.amount / total) * 100 : 0,
    heightPct: maxCategory ? (c.amount / maxCategory) * 100 : 0,
  }));

  // --- mes en curso ---
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dayTotals = Array(daysInMonth).fill(0);
  let thisMonthTotal = 0;
  list.forEach((e) => {
    const date = parseLocalDate(e.date);
    if (date.getFullYear() === year && date.getMonth() === month) {
      dayTotals[date.getDate() - 1] += Number(e.amount) || 0;
      thisMonthTotal += Number(e.amount) || 0;
    }
  });
  const maxDay = Math.max(...dayTotals, 0);
  const days = dayTotals.map((value, i) => ({
    heightPct: maxDay ? Math.max(6, (value / maxDay) * 100) : 6,
    today: i + 1 === today.getDate(),
    future: i + 1 > today.getDate(),
    value,
  }));

  // --- tendencia: últimos 6 meses con datos ---
  const byMonth = {};
  list.forEach((e) => {
    const date = parseLocalDate(e.date);
    const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
    byMonth[key] = (byMonth[key] || 0) + (Number(e.amount) || 0);
  });
  const monthKeys = Object.keys(byMonth).sort().slice(-TREND_MONTHS);
  const months = monthKeys.map((key) => ({
    label: MONTHS_SHORT[Number(key.split('-')[1])],
    value: byMonth[key],
  }));
  const values = months.map((m) => m.value);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pad = (hi - lo) * 0.1 || hi * 0.1 || 1;
  const yOf = (v) => (hi === lo ? 100 : 200 - ((v - (lo - pad)) / (hi + pad - (lo - pad))) * 200);
  const trendPoints = [];
  months.forEach((m, i) => {
    const y = yOf(m.value).toFixed(1);
    trendPoints.push(`${i * 100},${y}`, `${(i + 1) * 100},${y}`);
  });
  const trendWidth = Math.max(months.length, 1) * 100;
  const trend = {
    width: trendWidth,
    points: trendPoints.join(' '),
    area: months.length ? `0,200 ${trendPoints.join(' ')} ${trendWidth},200` : '',
    months: months.map((m, i) => ({
      ...m,
      leftPct: ((i * 100 + 50) / trendWidth) * 100,
      topPct: yOf(m.value) / 2,
    })),
    deltaPct: months.length >= 2 && months[0].value ? (months[months.length - 1].value / months[0].value - 1) * 100 : null,
    fromLabel: months.length ? months[0].label : '',
  };

  // --- historial ---
  const ordered = [...list].sort(compareDesc);
  const dayTotalsAll = {};
  list.forEach((e) => {
    const key = dayKey(parseLocalDate(e.date));
    dayTotalsAll[key] = (dayTotalsAll[key] || 0) + (Number(e.amount) || 0);
  });
  const groups = [];
  ordered.slice(0, MAX_HISTORY_ROWS).forEach((e) => {
    const date = parseLocalDate(e.date);
    const key = dayKey(date);
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = { key, label: groupLabel(date, today), total: dayTotalsAll[key], items: [] };
      groups.push(group);
    }
    group.items.push(e);
  });

  return {
    total,
    count,
    average: count ? total / count : 0,
    topCategory: sorted.length ? sorted[0].name : '—',
    categoryCount: sorted.length,
    categories,
    month: { name: MONTHS[month], year, daysInMonth, total: thisMonthTotal, days },
    trend,
    groups,
    hiddenRows: Math.max(0, list.length - MAX_HISTORY_ROWS),
    latest: ordered[0] || null,
    todayLong: longDate(today),
  };
}

/** Texto de la fecha del último registro: "HOY 18:42", "AYER 09:10" o "30 OCT 18:42". */
export function formatStamp(expense, today = new Date()) {
  if (!expense) return '';
  const created = parseCreatedAt(expense.created_at);
  const time = created
    ? `${String(created.getHours()).padStart(2, '0')}:${String(created.getMinutes()).padStart(2, '0')}`
    : '';
  const date = parseLocalDate(expense.date);
  const label = groupLabel(date, today);
  const day = label.startsWith('HOY') || label.startsWith('AYER') ? label : `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
  return time ? `${day} ${time}` : day;
}
