// Gamification helpers — all pure functions computed client-side from
// expenses/budgets already in memory, no backend persistence needed.

const DAY_MS = 24 * 60 * 60 * 1000;

function toDayKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * Consecutive-day streak of logging at least one expense, counting back
 * from today (or yesterday, so a streak isn't lost until a full day passes).
 */
export function calculateStreak(expenses) {
  if (!expenses || expenses.length === 0) return 0;

  const days = new Set(expenses.map((e) => toDayKey(e.date)));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let cursor = new Date(today);
  if (!days.has(toDayKey(cursor))) {
    // Allow the streak to still count if today has no entry yet,
    // as long as yesterday does.
    cursor = new Date(today.getTime() - DAY_MS);
    if (!days.has(toDayKey(cursor))) return 0;
  }

  let streak = 0;
  while (days.has(toDayKey(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - DAY_MS);
  }
  return streak;
}

const LEVELS = [
  { name: 'Novato', min: 0, icon: '🌱' },
  { name: 'Aprendiz', min: 10, icon: '📘' },
  { name: 'Experto', min: 50, icon: '⭐' },
  { name: 'Maestro', min: 150, icon: '👑' },
];

/** User level derived from total number of expenses logged. */
export function getUserLevel(expenseCount) {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (expenseCount >= level.min) current = level;
  }
  const nextIndex = LEVELS.indexOf(current) + 1;
  const next = LEVELS[nextIndex] || null;
  const progress = next
    ? Math.min(100, Math.round(((expenseCount - current.min) / (next.min - current.min)) * 100))
    : 100;

  return { ...current, next, progress, count: expenseCount };
}

/**
 * A handful of computed achievements. `budgetsProgress` is optional
 * (array of { percentage } from GET /budgets/progress/current).
 */
export function calculateAchievements({ expenses = [], budgetsProgress = [] } = {}) {
  const streak = calculateStreak(expenses);
  const achievements = [];

  achievements.push({
    id: 'first-expense',
    icon: '🎉',
    label: 'Primer Gasto',
    unlocked: expenses.length >= 1,
  });

  achievements.push({
    id: 'week-streak',
    icon: '🔥',
    label: '7 Días Seguidos',
    unlocked: streak >= 7,
  });

  achievements.push({
    id: 'month-streak',
    icon: '🏆',
    label: 'Mes Constante',
    unlocked: streak >= 30,
  });

  achievements.push({
    id: 'fifty-logged',
    icon: '📚',
    label: '50 Gastos Registrados',
    unlocked: expenses.length >= 50,
  });

  const hasBudgets = budgetsProgress.length > 0;
  achievements.push({
    id: 'under-budget',
    icon: '💰',
    label: 'Bajo Presupuesto',
    unlocked: hasBudgets && budgetsProgress.every((b) => b.percentage < 100),
  });

  return achievements;
}
