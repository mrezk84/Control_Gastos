import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { getAllExpenses } from '../services/api';
import { formatShare, toDate } from '../utils/formatters';
import { categoryIconClass } from '../utils/categoryIcons';
import Icon from '../components/ui/Icon';
import PageLoader from '../components/ui/PageLoader';
import { useMoney } from '../context/ExpensesContext';
import logger from '../utils/logger';
import { EXPENSE_CREATED_EVENT } from '../utils/events';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const FONT_SANS = "'Geist Variable', 'Geist', system-ui, sans-serif";
const FONT_MONO = "'Geist Mono Variable', 'Geist Mono', ui-monospace, monospace";
ChartJS.defaults.font.family = FONT_SANS;
ChartJS.defaults.font.size = 12;

const PERIOD_OPTIONS = [
  { label: 'Este mes', value: 'month' },
  { label: 'Mes anterior', value: 'lastMonth' },
  { label: 'Últimos 3 meses', value: '3months' },
  { label: 'Últimos 6 meses', value: '6months' },
  { label: 'Este año', value: 'year' },
  { label: 'Todo', value: 'all' },
];

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAY_NAMES_LONG = ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'];
const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const TOP_CATEGORIES = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Colores de los gráficos leídos de los tokens del tema activo (caja.css). */
const readPalette = () => {
  const css = getComputedStyle(document.documentElement);
  const v = (name) => css.getPropertyValue(name).trim();
  return {
    text: v('--mu'),
    strong: v('--tx'),
    line: v('--line'),
    panel: v('--panel'),
    raised: v('--raised'),
    accent: v('--acct'),
    cats: [1, 2, 3, 4, 5, 6].map((i) => v(`--cat-${i}`)),
  };
};

function Kpi({ icon, label, value, sub }) {
  return (
    <div className="cj-kpi">
      <div className="cj-kpi-label"><Icon name={icon} duotone />{label}</div>
      <div className="cj-kpi-value">{value}</div>
      <div className="cj-kpi-sub">{sub}</div>
    </div>
  );
}

function Analytics() {
  const { formatCurrency, formatK } = useMoney();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');
  const [palette, setPalette] = useState(readPalette);

  // Los gráficos se repintan con los colores del tema al cambiarlo
  useEffect(() => {
    const onThemeChange = () => setPalette(readPalette());
    window.addEventListener('theme-changed', onThemeChange);
    return () => window.removeEventListener('theme-changed', onThemeChange);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const res = await getAllExpenses();
      setExpenses(res.data);
    } catch (err) {
      logger.apiError('Error fetching data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh when an expense is created anywhere in the app (FAB / Cmd+N).
  useEffect(() => {
    window.addEventListener(EXPENSE_CREATED_EVENT, fetchData);
    return () => window.removeEventListener(EXPENSE_CREATED_EVENT, fetchData);
  }, [fetchData]);

  // Filter expenses by period
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return expenses.filter((expense) => {
      const expDate = toDate(expense.date);

      switch (period) {
        case 'month':
          return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
        case 'lastMonth':
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          return expDate.getMonth() === lastMonth && expDate.getFullYear() === lastMonthYear;
        case '3months':
          const threeMonthsAgo = new Date(currentYear, currentMonth - 3, 1);
          return expDate >= threeMonthsAgo;
        case '6months':
          const sixMonthsAgo = new Date(currentYear, currentMonth - 6, 1);
          return expDate >= sixMonthsAgo;
        case 'year':
          return expDate.getFullYear() === currentYear;
        default:
          return true;
      }
    });
  }, [expenses, period]);

  // Calculate analytics
  const analytics = useMemo(() => {
    const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const avg = filteredExpenses.length ? total / filteredExpenses.length : 0;
    const maxExpense = filteredExpenses.length ? Math.max(...filteredExpenses.map(e => e.amount)) : 0;
    const minExpense = filteredExpenses.length ? Math.min(...filteredExpenses.map(e => e.amount)) : 0;

    // Categorías, de mayor a menor
    const categoryMap = {};
    filteredExpenses.forEach((e) => {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
    });
    const categories = Object.entries(categoryMap)
      .map(([name, amount]) => ({ name, amount, share: total > 0 ? (amount / total) * 100 : 0 }))
      .sort((x, y) => y.amount - x.amount);

    // Día de la semana, mes y días que abarca el período (para el promedio diario)
    const days = [0, 0, 0, 0, 0, 0, 0];
    const monthlyMap = {};
    let first = Infinity;
    let last = -Infinity;
    filteredExpenses.forEach((e) => {
      const d = toDate(e.date);
      days[d.getDay()] += e.amount;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[key] = (monthlyMap[key] || 0) + e.amount;
      first = Math.min(first, d.getTime());
      last = Math.max(last, d.getTime());
    });
    const sortedMonths = Object.keys(monthlyMap).sort();
    const spanDays = filteredExpenses.length ? Math.round((last - first) / DAY_MS) + 1 : 0;

    return {
      total,
      avg,
      maxExpense,
      minExpense,
      count: filteredExpenses.length,
      categories,
      days,
      monthlyMap,
      sortedMonths,
      spanDays,
      dailyAvg: spanDays > 0 ? total / spanDays : 0,
    };
  }, [filteredExpenses]);

  // Comparison against the equivalent previous period (skipped for "Todo",
  // where there's no well-defined previous window). Uses the raw, unfiltered
  // `expenses` list so both windows are computed the same way regardless of
  // the currently selected period.
  const periodComparison = useMemo(() => {
    if (period === 'all') return null;

    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();

    const sumInRange = (start, end) =>
      expenses
        .filter((e) => {
          const d = toDate(e.date);
          return d >= start && d < end;
        })
        .reduce((sum, e) => sum + e.amount, 0);

    let currentStart, currentEnd, previousStart, previousEnd, label;

    switch (period) {
      case 'month':
        currentStart = new Date(y, m, 1);
        currentEnd = new Date(y, m + 1, 1);
        previousStart = new Date(y, m - 1, 1);
        previousEnd = new Date(y, m, 1);
        label = 'al mes anterior';
        break;
      case 'lastMonth':
        currentStart = new Date(y, m - 1, 1);
        currentEnd = new Date(y, m, 1);
        previousStart = new Date(y, m - 2, 1);
        previousEnd = new Date(y, m - 1, 1);
        label = 'al mes previo';
        break;
      case '3months':
        currentStart = new Date(y, m - 3, 1);
        currentEnd = new Date(y, m + 1, 1);
        previousStart = new Date(y, m - 6, 1);
        previousEnd = new Date(y, m - 3, 1);
        label = 'a los 3 meses anteriores';
        break;
      case '6months':
        currentStart = new Date(y, m - 6, 1);
        currentEnd = new Date(y, m + 1, 1);
        previousStart = new Date(y, m - 12, 1);
        previousEnd = new Date(y, m - 6, 1);
        label = 'a los 6 meses anteriores';
        break;
      case 'year':
        currentStart = new Date(y, 0, 1);
        currentEnd = new Date(y + 1, 0, 1);
        previousStart = new Date(y - 1, 0, 1);
        previousEnd = new Date(y, 0, 1);
        label = 'al año anterior';
        break;
      default:
        return null;
    }

    const currentTotal = sumInRange(currentStart, currentEnd);
    const previousTotal = sumInRange(previousStart, previousEnd);
    const diff = currentTotal - previousTotal;
    const percentage = previousTotal > 0
      ? (diff / previousTotal) * 100
      : (currentTotal > 0 ? 100 : 0);

    return { currentTotal, previousTotal, diff, percentage, label };
  }, [expenses, period]);

  // Simple linear projection for the current calendar month: not ML, just
  // (spent so far / days elapsed) * days in month.
  const monthlyProjection = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const monthStart = new Date(y, m, 1);
    const monthEnd = new Date(y, m + 1, 1);

    const totalSoFar = expenses
      .filter((e) => {
        const d = toDate(e.date);
        return d >= monthStart && d < monthEnd;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    if (totalSoFar === 0) return null;

    const dailyAvg = totalSoFar / dayOfMonth;
    const projected = dailyAvg * daysInMonth;

    return { totalSoFar, dailyAvg, projected, daysInMonth, dayOfMonth };
  }, [expenses]);

  // Claves del período: frases cortas calculadas sobre los gastos filtrados
  const insights = useMemo(() => {
    const list = [];
    const [top, second] = analytics.categories;

    if (top) {
      list.push({
        icon: 'trophy',
        text: `${top.name} es tu categoría principal: ${formatShare(top.share)} del total.`,
      });
    }
    if (analytics.count > 0) {
      list.push({
        icon: 'calendar-dots',
        text: `Gastas ${formatCurrency(Math.round(analytics.dailyAvg))} por día en promedio (${analytics.spanDays} ${analytics.spanDays === 1 ? 'día' : 'días'}).`,
      });
    }
    if (top && second) {
      list.push({
        icon: 'arrows-left-right',
        text: `${top.name} supera a ${second.name} por ${formatCurrency(top.amount - second.amount)}.`,
      });
    }
    const maxDay = Math.max(...analytics.days);
    if (maxDay > 0) {
      list.push({
        icon: 'chart-bar',
        text: `Los ${DAY_NAMES_LONG[analytics.days.indexOf(maxDay)]} son tu día de más gasto.`,
      });
    }
    return list;
  }, [analytics, formatCurrency]);

  // Distribución: las 5 categorías principales y el resto agrupado, como en el Panel
  const distribution = useMemo(() => {
    const top = analytics.categories.slice(0, TOP_CATEGORIES);
    const rest = analytics.categories.slice(TOP_CATEGORIES);
    if (rest.length === 1) return [...top, rest[0]];
    if (rest.length > 1) {
      const amount = rest.reduce((sum, c) => sum + c.amount, 0);
      top.push({ name: 'Resto', amount, share: analytics.total > 0 ? (amount / analytics.total) * 100 : 0, isRest: true });
    }
    return top;
  }, [analytics.categories, analytics.total]);

  const tooltip = useMemo(() => ({
    backgroundColor: palette.raised,
    titleColor: palette.strong,
    bodyColor: palette.strong,
    borderColor: palette.line,
    borderWidth: 1,
    padding: 12,
    cornerRadius: 12,
    displayColors: false,
    titleFont: { family: FONT_SANS, weight: 500, size: 12 },
    bodyFont: { family: FONT_MONO, weight: 600, size: 13 },
  }), [palette]);

  const axis = useMemo(() => ({
    x: {
      grid: { display: false },
      border: { color: palette.line },
      ticks: { color: palette.text },
    },
    y: {
      beginAtZero: true,
      grid: { color: palette.line },
      border: { display: false },
      ticks: { color: palette.text, maxTicksLimit: 5, font: { family: FONT_MONO, size: 11 }, callback: (value) => formatK(value) },
    },
  }), [palette, formatK]);

  const categoryChart = useMemo(() => ({
    data: {
      labels: distribution.map((c) => c.name),
      datasets: [{
        data: distribution.map((c) => c.amount),
        backgroundColor: distribution.map((_, i) => palette.cats[i]),
        borderColor: palette.panel,
        borderWidth: 3,
        hoverOffset: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: { display: false },
        tooltip: { ...tooltip, callbacks: { label: (ctx) => formatCurrency(ctx.parsed) } },
      },
    },
  }), [distribution, palette, tooltip, formatCurrency]);

  const dayChart = useMemo(() => {
    const max = Math.max(...analytics.days);
    return {
      data: {
        labels: DAY_NAMES,
        datasets: [{
          data: analytics.days,
          backgroundColor: analytics.days.map((v) => (v === max && max > 0 ? palette.accent : `${palette.text}59`)),
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 44,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { ...tooltip, callbacks: { label: (ctx) => formatCurrency(ctx.parsed.y) } },
        },
        scales: axis,
      },
    };
  }, [analytics.days, palette, tooltip, axis, formatCurrency]);

  const monthChart = useMemo(() => ({
    data: {
      labels: analytics.sortedMonths.map((m) => {
        const [y, mo] = m.split('-');
        return `${MONTH_NAMES[parseInt(mo, 10) - 1]} ${y.slice(2)}`;
      }),
      datasets: [{
        data: analytics.sortedMonths.map((m) => analytics.monthlyMap[m]),
        borderColor: palette.accent,
        borderWidth: 2.5,
        backgroundColor: (ctx) => {
          const { chart } = ctx;
          if (!chart.chartArea) return 'transparent';
          const g = chart.ctx.createLinearGradient(0, chart.chartArea.top, 0, chart.chartArea.bottom);
          g.addColorStop(0, `${palette.accent}40`);
          g.addColorStop(1, `${palette.accent}00`);
          return g;
        },
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: palette.panel,
        pointBorderColor: palette.accent,
        pointBorderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: { ...tooltip, callbacks: { label: (ctx) => formatCurrency(ctx.parsed.y) } },
      },
      scales: axis,
    },
  }), [analytics.monthlyMap, analytics.sortedMonths, palette, tooltip, axis, formatCurrency]);

  if (loading) {
    return <PageLoader label="Cargando analíticas…" />;
  }

  const periodLabel = PERIOD_OPTIONS.find((o) => o.value === period)?.label || '';
  const up = periodComparison && periodComparison.diff >= 0;

  return (
    <div className="cj-page">
      <header className="cj-head">
        <div>
          <span className="cj-eyebrow">Análisis · {periodLabel}</span>
          <h1 className="cj-greeting">Analíticas</h1>
        </div>
        <label className="cj-select">
          <span className="cj-sr">Período</span>
          <Icon name="calendar-blank" />
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <Icon name="caret-down" />
        </label>
      </header>

      {analytics.count === 0 ? (
        <section className="cj-card">
          <div className="cj-empty">
            {expenses.length === 0
              ? 'Todavía no hay gastos para analizar. Registra el primero desde el Panel.'
              : 'No hay gastos en este período. Prueba con otro.'}
          </div>
        </section>
      ) : (
        <>
          <div className="cj-kpis">
            <Kpi icon="wallet" label="Total" value={formatCurrency(analytics.total)} sub={`${analytics.count} ${analytics.count === 1 ? 'gasto' : 'gastos'}`} />
            <Kpi icon="calendar-dots" label="Promedio diario" value={formatCurrency(Math.round(analytics.dailyAvg))} sub={`En ${analytics.spanDays} ${analytics.spanDays === 1 ? 'día' : 'días'}`} />
            <Kpi icon="receipt" label="Promedio por gasto" value={formatCurrency(Math.round(analytics.avg))} sub="Ticket medio" />
            <Kpi icon="arrow-line-up" label="Gasto mayor" value={formatCurrency(analytics.maxExpense)} sub={`Menor ${formatCurrency(analytics.minExpense)}`} />
          </div>

          {(periodComparison || monthlyProjection) && (
            <div className="cj-kpis">
              {periodComparison && (
                <div className="cj-kpi">
                  <div className="cj-kpi-label"><Icon name={up ? 'trend-up' : 'trend-down'} duotone />Frente {periodComparison.label}</div>
                  <div className={`cj-kpi-value ${up ? 'is-up' : 'is-down'}`}>
                    {up ? '+' : '−'}{formatShare(Math.abs(periodComparison.percentage))}
                  </div>
                  <div className="cj-kpi-sub">
                    {formatCurrency(periodComparison.currentTotal)} vs {formatCurrency(periodComparison.previousTotal)}
                  </div>
                </div>
              )}
              {monthlyProjection && (
                <div className="cj-kpi">
                  <div className="cj-kpi-label"><Icon name="crosshair" duotone />Proyección de este mes</div>
                  <div className="cj-kpi-value">{formatCurrency(Math.round(monthlyProjection.projected))}</div>
                  <div className="cj-kpi-sub">
                    {formatCurrency(monthlyProjection.totalSoFar)} en {monthlyProjection.dayOfMonth} de {monthlyProjection.daysInMonth} días
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="cj-charts">
            <section className="cj-card cj-card-wide" aria-label="Distribución por categoría">
              <div className="cj-card-head">
                <h2 className="cj-card-title">Por categoría</h2>
                <span className="cj-card-meta">{analytics.categories.length} EN USO</span>
              </div>
              <div className="cj-donut">
                <div className="cj-donut-chart">
                  <Doughnut data={categoryChart.data} options={categoryChart.options} />
                  <div className="cj-donut-center">
                    <span>Total</span>
                    <b>{formatK(analytics.total)}</b>
                  </div>
                </div>
                <div className="cj-legend">
                  {distribution.map((c, i) => (
                    <div className="cj-legend-row" key={c.name}>
                      <span className="cj-swatch" style={{ '--c': palette.cats[i] }} />
                      <i className={c.isRest ? 'ph-duotone ph-dots-three' : categoryIconClass(c.name)} aria-hidden="true" />
                      <span className="cj-legend-name">{c.name}</span>
                      <span className="cj-legend-amt">{formatCurrency(c.amount)}</span>
                      <span className="cj-legend-pct">{formatShare(c.share)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="cj-card cj-card-narrow" aria-label="Claves del período">
              <div className="cj-card-head">
                <h2 className="cj-card-title"><Icon name="lightbulb" />Claves del período</h2>
              </div>
              <ul className="cj-insights">
                {insights.map((insight) => (
                  <li key={insight.icon}>
                    <span className="cj-row-ico"><Icon name={insight.icon} duotone /></span>
                    <span>{insight.text}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="cj-charts">
            <section className="cj-card cj-card-narrow" aria-label="Gasto por día de la semana">
              <div className="cj-card-head">
                <h2 className="cj-card-title">Por día de la semana</h2>
                <span className="cj-card-meta">TOTAL ACUMULADO</span>
              </div>
              <div className="cj-chart"><Bar data={dayChart.data} options={dayChart.options} /></div>
            </section>

            {analytics.sortedMonths.length > 1 && (
              <section className="cj-card cj-card-wide" aria-label="Tendencia mensual">
                <div className="cj-card-head">
                  <h2 className="cj-card-title">Tendencia mensual</h2>
                  <span className="cj-card-meta">{analytics.sortedMonths.length} {analytics.sortedMonths.length === 1 ? 'MES' : 'MESES'}</span>
                </div>
                <div className="cj-chart"><Line data={monthChart.data} options={monthChart.options} /></div>
              </section>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Analytics;
