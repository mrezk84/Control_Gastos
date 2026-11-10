// Gastos hormiga: compras menores a un umbral (docs/design/asistente-hormiga.md). Cálculos puros, sin React.
import { parseLocalDate } from './dashboardStats';

export const DEFAULT_THRESHOLD = 300;
export const DEFAULT_ANT_LIMIT = 3000;
export const CHALLENGE_DAYS = 7;
const KEYS = { threshold: 'hormiga.umbral', limit: 'hormiga.tope', days: 'hormiga.reto', welcome: 'hormiga.bienvenida', goals: 'hormiga.metas' };

/** Nivel 0 = dentro del tope, 1 = cerca (desde `warnPct` %), 2 = tope superado. */
export function antStatus(total, limit, warnPct = 80) {
  const spent = Number(total) || 0;
  const cap = Number(limit) || 0;
  const ratio = cap > 0 ? spent / cap : 0;
  const level = ratio > 1 ? 2 : ratio * 100 >= warnPct ? 1 : 0;
  return { level, ratio, left: cap - spent, widthPct: Math.min(100, ratio * 100) };
}

const normalize = (text) => String(text || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * Resumen del mes de `now`: total y cantidad de compras chicas, su peso sobre el gasto del mes,
 * gasto por semana del mes (4 tramos) y las tres descripciones que más suman ("dónde se va").
 */
export function buildHormiga(expenses, threshold, now = new Date()) {
  const month = now.getMonth();
  const year = now.getFullYear();
  const inMonth = expenses.filter((e) => {
    const d = parseLocalDate(e.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });
  const monthTotal = inMonth.reduce((sum, e) => sum + e.amount, 0);
  const small = inMonth.filter((e) => e.amount > 0 && e.amount < threshold);
  const total = Math.round(small.reduce((sum, e) => sum + e.amount, 0) * 100) / 100;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks = [0, 0, 0, 0];
  small.forEach((e) => {
    const day = parseLocalDate(e.date).getDate();
    weeks[Math.min(3, Math.floor(((day - 1) / daysInMonth) * 4))] += e.amount;
  });
  const maxWeek = Math.max(...weeks, 0);
  const currentWeek = Math.min(3, Math.floor(((now.getDate() - 1) / daysInMonth) * 4));

  const groups = new Map();
  small.forEach((e) => {
    const key = normalize(e.description) || 'sin descripción';
    const g = groups.get(key) || { name: e.description?.trim() || 'Sin descripción', category: e.category, count: 0, amount: 0 };
    g.count += 1;
    g.amount += e.amount;
    groups.set(key, g);
  });
  const top = [...groups.values()]
    .map((g) => ({ ...g, amount: Math.round(g.amount * 100) / 100 }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  return {
    total,
    count: small.length,
    sharePct: monthTotal > 0 ? (total / monthTotal) * 100 : 0,
    weeks: weeks.map((value, i) => ({ value, heightPct: maxWeek > 0 ? Math.max(8, (value / maxWeek) * 100) : 8, current: i === currentWeek })),
    top,
    elapsedDays: now.getDate(),
    monthLabel: now.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }).toUpperCase(),
  };
}

/** Simulador: lo que se recupera si se reduce `pct` % de las compras chicas del mes. */
export function simulate(monthTotal, pct) {
  const monthly = (Number(monthTotal) || 0) * (Math.max(0, Math.min(100, pct)) / 100);
  return { monthly, yearly: monthly * 12 };
}

export function simulatorHint(pct, hasData) {
  if (!hasData) return 'Registra compras chicas y aquí verás cuánto podrías recuperar.';
  if (pct === 0) return 'Mueve el deslizador y te muestro cuánto queda.';
  if (pct >= 70) return 'Ambicioso. Mejor empezar con menos y sostenerlo.';
  if (pct >= 25) return 'Buen punto de partida: se nota sin sufrirlo.';
  return 'Un cambio pequeño, pero sumado todo el año ya cuenta.';
}

const readNumber = (key, fallback) => {
  try {
    const n = parseFloat(localStorage.getItem(key));
    return n > 0 ? n : fallback;
  } catch {
    return fallback;
  }
};
const writeValue = (key, value) => {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* sin almacenamiento: vale solo para esta sesión */
  }
};

export const loadThreshold = () => readNumber(KEYS.threshold, DEFAULT_THRESHOLD);
export const saveThreshold = (n) => writeValue(KEYS.threshold, n);
export const loadAntLimit = () => readNumber(KEYS.limit, DEFAULT_ANT_LIMIT);
export const saveAntLimit = (n) => writeValue(KEYS.limit, n);

/** Días del reto cumplidos: arreglo de CHALLENGE_DAYS booleanos. */
export function loadChallenge() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEYS.days));
    if (Array.isArray(parsed) && parsed.length === CHALLENGE_DAYS) return parsed.map(Boolean);
  } catch {
    /* sin datos guardados */
  }
  return Array(CHALLENGE_DAYS).fill(false);
}
export const saveChallenge = (days) => writeValue(KEYS.days, JSON.stringify(days));

/** Mes anterior a `now` (mismo día, o el último del mes si no existe). */
export function previousMonth(now = new Date()) {
  const last = new Date(now.getFullYear(), now.getMonth(), 0);
  return new Date(last.getFullYear(), last.getMonth(), Math.min(now.getDate(), last.getDate()));
}

/** Icono Phosphor de una compra chica: por palabra clave y, si no, por su categoría. */
export function antIcon(name, category) {
  const text = normalize(name);
  if (/cafe|panader|medialuna|bar\b/.test(text)) return 'coffee';
  if (/delivery|pedido|rappi|pedidosya|uber ?eats|glovo/.test(text)) return 'bicycle';
  if (/suscri|netflix|spotify|musica|prime|youtube|disney|hbo/.test(text)) return 'repeat';
  if (/kiosco|golosina|snack|helado|chicle/.test(text)) return 'cookie';
  return null; // el llamador usa el icono de la categoría
}

export const SUGGESTED_QUESTIONS = [
  { id: 'que-es', label: '¿Qué es un gasto hormiga?', icon: 'question' },
  { id: 'gastando', label: '¿En qué estoy gastando de más?', icon: 'coins' },
  { id: 'plan', label: 'Dame un plan sin dejar todo de golpe', icon: 'target' },
  { id: 'comparar', label: 'Comparar con el mes anterior', icon: 'chart-bar' },
];

const INTENT_PATTERNS = [
  ['que-es', /\bque (es|son)\b|significa|definicion/],
  ['comparar', /compar|mes anterior|mes pasado|septiembre|octubre|antes/],
  ['plan', /plan|reto|ahorr|reduc|bajar|recuper|dejar|empez/],
  ['gastando', /gastando|de mas|donde|se me va|se va|mas se repite|top|que gasto|hormiga/],
];

export function detectIntent(question) {
  const text = normalize(question);
  const found = INTENT_PATTERNS.find(([, re]) => re.test(text));
  return found ? found[0] : 'desconocido';
}

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Respuesta del asistente a una pregunta, armada con los números de la persona (sin servidor: solo lee
 * los gastos). Devuelve bloques: { type: 'p' | 'ticket' | 'steps' | 'cta', ... }.
 * ctx = { data, prev, threshold, money } con money(n) → "$1.030,50".
 */
export function answer(intentOrQuestion, ctx) {
  const intent = SUGGESTED_QUESTIONS.some((q) => q.id === intentOrQuestion) ? intentOrQuestion : detectIntent(intentOrQuestion);
  const { data, prev, threshold, money } = ctx;

  if (intent === 'que-es') {
    return [
      { type: 'p', text: `Un gasto hormiga es una compra chica y repetida: un café, un kiosco, un delivery. Cada una parece nada, pero juntas pesan. Aquí cuento como hormiga lo que cuesta menos de ${money(threshold)}.` },
      { type: 'p', text: 'Puedes cambiar ese umbral en la pantalla de inicio. No es mala idea comprar un café: la idea es que lo elijas, no que se te pase.' },
    ];
  }

  if (intent === 'comparar') {
    if (prev.count === 0 && data.count === 0) {
      return [{ type: 'p', text: 'Todavía no veo compras chicas ni este mes ni el anterior. Cuando registres algunas, las comparo.' }];
    }
    const diff = round2(data.total - prev.total);
    const mood = diff > 0 ? 'Subió un poco: nada grave, para eso estamos.' : diff < 0 ? 'Bajó. Vas bien.' : 'Quedó igual.';
    return [
      { type: 'p', text: 'Así vienen tus compras chicas, comparadas con el mes anterior a esta altura:' },
      { type: 'ticket', rows: [{ label: 'Este mes', value: money(data.total) }, { label: 'Mes anterior', value: money(prev.total) }], total: { label: diff >= 0 ? 'DIFERENCIA' : 'AHORRASTE', value: money(Math.abs(diff)) } },
      { type: 'p', text: mood },
    ];
  }

  if (intent === 'plan') {
    if (data.count === 0) {
      return [{ type: 'p', text: 'Todavía no veo compras chicas este mes, así que no tengo de dónde recortar. Si registras algunas, te armo un plan con tus números.' }];
    }
    const first = data.top[0];
    const second = data.top[1];
    const recover = simulate(data.total, 40).monthly;
    return [
      { type: 'p', text: 'Me gusta empezar de a un hábito: funciona mejor que dejar todo de golpe. Te propongo:' },
      {
        type: 'steps',
        items: [
          `${first.name}: la mitad de las veces esta semana.`,
          second ? `${second.name}: uno por semana, elegido con ganas.` : 'Una compra chica por día, elegida con ganas.',
        ],
      },
      { type: 'p', text: `Así podrías recuperar unos ${money(recover)} al mes. ¿Lo armamos como reto de 7 días?` },
      { type: 'cta' },
    ];
  }

  if (intent === 'gastando') {
    if (data.count === 0) {
      return [{ type: 'p', text: `Este mes no veo compras menores a ${money(threshold)}. Buen momento para subir o bajar el umbral si quieres revisarlo.` }];
    }
    const rows = data.top.slice(0, 2).map((t) => ({ label: t.name, value: `${t.count} × ${money(round2(t.amount / t.count))}` }));
    const topSum = round2(data.top.slice(0, 2).reduce((s, t) => s + t.amount, 0));
    const share = data.total > 0 ? Math.round((topSum / data.total) * 100) : 0;
    return [
      { type: 'p', text: 'Lo que más se repite son compras chicas. Cada una parece nada, pero juntas suman:' },
      { type: 'ticket', rows, total: { label: data.top.length > 1 ? 'ENTRE LOS DOS' : 'EN TOTAL', value: money(topSum) } },
      { type: 'p', text: `Es el ${share} % de tus gastos hormiga. Nada grave: es el tipo de gasto más fácil de bajar.` },
    ];
  }

  return [
    { type: 'p', text: 'Todavía solo sé hablar de tus gastos hormiga. Prueba con una de las preguntas de abajo.' },
  ];
}

/** Lo que se "recuperó" con el reto: días cumplidos × lo que se gasta en promedio por día en compras chicas. */
export function recoveredByChallenge(daysDone, monthTotal, elapsedDays) {
  const perDay = elapsedDays > 0 ? monthTotal / elapsedDays : 0;
  return round2(daysDone * perDay);
}

export const GOALS = [
  { id: 'ahorrar', label: 'Ahorrar para algo' },
  { id: 'fin', label: 'Llegar tranquilo a fin de mes' },
  { id: 'entender', label: 'Entender mi plata' },
];

export const LESSONS = [
  {
    id: 'pequeno',
    title: 'El efecto de lo pequeño',
    minutes: 3,
    icon: 'book-open',
    body: [
      'Una compra chica no duele: nadie siente un café de $95. Por eso se repite sin que lo notes.',
      'La cuenta está en la repetición: $95 todos los días laborales son casi $2.000 al mes y más de $23.000 al año, sin contar lo que ya sumaste en otras cosas.',
      'No se trata de dejar de disfrutar. Se trata de elegir cuáles compras chicas valen la pena y cuáles pasaron sin que las vieras.',
      'Un primer paso: mira tus tres gastos hormiga más repetidos y decide cuál bajarías a la mitad.',
    ],
  },
  {
    id: 'pagarte',
    title: 'Pagarte primero a vos',
    minutes: 4,
    icon: 'piggy-bank',
    body: [
      'Pagarte primero es separar un monto para ti apenas cobras, antes de gastar en lo demás, en lugar de ahorrar lo que sobre.',
      'Lo que sobra casi siempre es poco. Lo que separas primero es una decisión tomada.',
      'Con lo que recuperas de tus gastos hormiga puedes empezar: si bajas un 40 % de tus compras chicas, esa diferencia es tu primer monto para separar.',
      'Empieza chico y constante. Un monto que puedas sostener todos los meses vale más que uno grande que abandonas al segundo.',
    ],
  },
];

/** ¿Ya vio la bienvenida? Sin almacenamiento disponible, se muestra solo en esta visita. */
export function wasWelcomed() {
  try {
    return localStorage.getItem(KEYS.welcome) === '1';
  } catch {
    return false;
  }
}

export function loadGoals() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEYS.goals));
    if (Array.isArray(parsed)) return parsed.filter((g) => GOALS.some((x) => x.id === g));
  } catch {
    /* sin metas guardadas */
  }
  return ['ahorrar'];
}

export function saveGoals(goals) {
  writeValue(KEYS.goals, JSON.stringify(goals));
  writeValue(KEYS.welcome, '1');
}
