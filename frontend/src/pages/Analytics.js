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
import { getAllExpenses, getExpensesSummary } from '../services/api';
import { CHART_COLORS, formatCurrency } from '../utils';
import logger from '../utils/logger';
import { useCountUp } from '../hooks/useCountUp';
import { EXPENSE_CREATED_EVENT } from '../components/Layout/SidebarLayout';

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

const PERIOD_OPTIONS = [
  { label: 'Este mes', value: 'month' },
  { label: 'Mes anterior', value: 'lastMonth' },
  { label: 'Últimos 3 meses', value: '3months' },
  { label: 'Últimos 6 meses', value: '6months' },
  { label: 'Este año', value: 'year' },
  { label: 'Todo', value: 'all' },
];

function Analytics() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  // Detect theme changes
  useEffect(() => {
    const handleThemeChange = () => {
      setTheme(localStorage.getItem('theme') || 'dark');
    };

    window.addEventListener('theme-changed', handleThemeChange);
    window.addEventListener('storage', handleThemeChange);

    return () => {
      window.removeEventListener('theme-changed', handleThemeChange);
      window.removeEventListener('storage', handleThemeChange);
    };
  }, []);

  // Chart colors based on theme
  const getChartColors = () => {
    if (theme === 'light') {
      return {
        text: '#475569',
        grid: 'rgba(0, 0, 0, 0.06)',
        gridSecondary: 'rgba(0, 0, 0, 0.03)',
      };
    }
    return {
      text: '#a0a0c0',
      grid: 'rgba(255, 255, 255, 0.04)',
      gridSecondary: 'rgba(255, 255, 255, 0.02)',
    };
  };

  const chartColors = getChartColors();

  const fetchData = useCallback(async () => {
    try {
      const [expRes, sumRes] = await Promise.all([
        getAllExpenses(),
        getExpensesSummary().catch(() => null),
      ]);
      setExpenses(expRes.data);
      if (sumRes) setSummary(sumRes.data);
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
      const expDate = new Date(expense.date);

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

    // Category breakdown
    const categoryMap = {};
    filteredExpenses.forEach((e) => {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
    });

    // Day of week analysis
    const dayMap = {};
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    filteredExpenses.forEach((e) => {
      const day = new Date(e.date).getDay();
      dayMap[day] = (dayMap[day] || 0) + e.amount;
    });

    // Monthly trends
    const monthlyMap = {};
    filteredExpenses.forEach((e) => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[key] = (monthlyMap[key] || 0) + e.amount;
    });
    const sortedMonths = Object.keys(monthlyMap).sort();

    return {
      total,
      avg,
      maxExpense,
      minExpense,
      count: filteredExpenses.length,
      categoryMap,
      dayMap,
      dayNames,
      monthlyMap,
      sortedMonths,
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
          const d = new Date(e.date);
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
        label = 'el mes anterior';
        break;
      case 'lastMonth':
        currentStart = new Date(y, m - 1, 1);
        currentEnd = new Date(y, m, 1);
        previousStart = new Date(y, m - 2, 1);
        previousEnd = new Date(y, m - 1, 1);
        label = 'el mes previo a ese';
        break;
      case '3months':
        currentStart = new Date(y, m - 3, 1);
        currentEnd = new Date(y, m + 1, 1);
        previousStart = new Date(y, m - 6, 1);
        previousEnd = new Date(y, m - 3, 1);
        label = 'los 3 meses anteriores';
        break;
      case '6months':
        currentStart = new Date(y, m - 6, 1);
        currentEnd = new Date(y, m + 1, 1);
        previousStart = new Date(y, m - 12, 1);
        previousEnd = new Date(y, m - 6, 1);
        label = 'los 6 meses anteriores';
        break;
      case 'year':
        currentStart = new Date(y, 0, 1);
        currentEnd = new Date(y + 1, 0, 1);
        previousStart = new Date(y - 1, 0, 1);
        previousEnd = new Date(y, 0, 1);
        label = 'el año anterior';
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
        const d = new Date(e.date);
        return d >= monthStart && d < monthEnd;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    if (totalSoFar === 0) return null;

    const dailyAvg = totalSoFar / dayOfMonth;
    const projected = dailyAvg * daysInMonth;

    return { totalSoFar, dailyAvg, projected, daysInMonth, dayOfMonth };
  }, [expenses]);

  // Generate insights
  const insights = useMemo(() => {
    const insightsList = [];

    if (analytics.categoryMap) {
      const sortedCategories = Object.entries(analytics.categoryMap)
        .sort((a, b) => b[1] - a[1]);

      if (sortedCategories.length > 0) {
        const [topCategory, topAmount] = sortedCategories[0];
        const percentage = ((topAmount / analytics.total) * 100).toFixed(1);
        insightsList.push({
          icon: '🏆',
          text: `${topCategory} es tu categoría principal con ${percentage}% del total`,
        });
      }
    }

    if (analytics.count > 0) {
      const dailyAvg = analytics.total / 30; // Approximate
      insightsList.push({
        icon: '📊',
        text: `Gastás un promedio de ${formatCurrency(dailyAvg)} por día`,
      });
    }

    if (summary && summary.categories && summary.categories.length > 1) {
      const topCat = summary.categories[0];
      const secondCat = summary.categories[1];
      if (topCat && secondCat) {
        const diff = topCat.total - secondCat.total;
        insightsList.push({
          icon: '📈',
          text: `${topCat.category} supera a ${secondCat.category} por ${formatCurrency(diff)}`,
        });
      }
    }

    return insightsList;
  }, [analytics, summary]);

  // Chart data
  const categoryChartData = useMemo(() => ({
    labels: Object.keys(analytics.categoryMap),
    datasets: [{
      data: Object.values(analytics.categoryMap),
      backgroundColor: CHART_COLORS.slice(0, Object.keys(analytics.categoryMap).length),
      borderColor: 'transparent',
      borderWidth: 0,
      hoverOffset: 8,
    }],
  }), [analytics.categoryMap]);

  const dayChartData = useMemo(() => ({
    labels: analytics.dayNames,
    datasets: [{
      label: 'Gastos por día',
      data: analytics.dayNames.map((_, i) => analytics.dayMap[i] || 0),
      backgroundColor: CHART_COLORS.map(c => c + '40'),
      borderColor: CHART_COLORS,
      borderWidth: 1,
      borderRadius: 6,
    }],
  }), [analytics.dayMap, analytics.dayNames]);

  const monthlyChartData = useMemo(() => ({
    labels: analytics.sortedMonths.map(m => {
      const [y, mo] = m.split('-');
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return `${monthNames[parseInt(mo) - 1]} ${y.slice(2)}`;
    }),
    datasets: [{
      label: 'Gastos mensuales',
      data: analytics.sortedMonths.map(m => analytics.monthlyMap[m]),
      borderColor: '#43e97b',
      backgroundColor: 'rgba(67, 233, 123, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 5,
      pointBackgroundColor: '#43e97b',
    }],
  }), [analytics.monthlyMap, analytics.sortedMonths]);

  // Animated KPI counters
  const animatedTotal = useCountUp(analytics.total);
  const animatedAvg = useCountUp(analytics.avg);
  const animatedMax = useCountUp(analytics.maxExpense);
  const animatedMin = useCountUp(analytics.minExpense);
  const animatedCount = useCountUp(analytics.count);

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="spinner" />
        <p>Cargando analíticas...</p>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">📈 Analíticas</h1>
          <p className="page-subtitle">Análisis detallado de tus gastos</p>
        </div>
        <select
          className="period-select"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          {PERIOD_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* KPIs */}
      <div className="analytics-kpi-grid">
        <div className="analytics-kpi-card">
          <div className="analytics-kpi-icon purple">💸</div>
          <div className="analytics-kpi-label">Total Gastos</div>
          <div className="analytics-kpi-value">{formatCurrency(animatedTotal)}</div>
        </div>
        <div className="analytics-kpi-card">
          <div className="analytics-kpi-icon blue">📊</div>
          <div className="analytics-kpi-label">Promedio</div>
          <div className="analytics-kpi-value">{formatCurrency(animatedAvg)}</div>
        </div>
        <div className="analytics-kpi-card">
          <div className="analytics-kpi-icon green">📈</div>
          <div className="analytics-kpi-label">Gasto Mayor</div>
          <div className="analytics-kpi-value">{formatCurrency(animatedMax)}</div>
        </div>
        <div className="analytics-kpi-card">
          <div className="analytics-kpi-icon orange">📉</div>
          <div className="analytics-kpi-label">Gasto Menor</div>
          <div className="analytics-kpi-value">{formatCurrency(animatedMin)}</div>
        </div>
        <div className="analytics-kpi-card">
          <div className="analytics-kpi-icon pink">📋</div>
          <div className="analytics-kpi-label">Transacciones</div>
          <div className="analytics-kpi-value">{Math.round(animatedCount)}</div>
        </div>
      </div>

      {/* Comparativa vs período anterior + Proyección mensual */}
      {(periodComparison || monthlyProjection) && (
        <div className="comparison-grid">
          {periodComparison && (
            <div className="comparison-card">
              <div className="comparison-card-label">Vs. {periodComparison.label}</div>
              <div className={`comparison-card-value ${periodComparison.diff >= 0 ? 'up' : 'down'}`}>
                <span aria-hidden="true">{periodComparison.diff >= 0 ? '▲' : '▼'}</span>
                {' '}{Math.abs(periodComparison.percentage).toFixed(1)}%
              </div>
              <div className="comparison-card-detail">
                {formatCurrency(periodComparison.currentTotal)} vs {formatCurrency(periodComparison.previousTotal)}
              </div>
            </div>
          )}
          {monthlyProjection && (
            <div className="comparison-card">
              <div className="comparison-card-label">Proyección de este mes</div>
              <div className="comparison-card-value projection">
                {formatCurrency(monthlyProjection.projected)}
              </div>
              <div className="comparison-card-detail">
                {formatCurrency(monthlyProjection.totalSoFar)} en {monthlyProjection.dayOfMonth} de {monthlyProjection.daysInMonth} días
              </div>
            </div>
          )}
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="insights-section">
          <h2 className="section-title">💡 Insights</h2>
          <div className="insights-grid">
            {insights.map((insight, i) => (
              <div key={i} className="insight-card">
                <span className="insight-icon">{insight.icon}</span>
                <span className="insight-text">{insight.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="analytics-charts-grid">
        {/* Category Distribution */}
        <div className="chart-card-large">
          <h3 className="chart-title">Distribución por Categoría</h3>
          <div style={{ height: 320 }}>
            {Object.keys(analytics.categoryMap).length > 0 ? (
              <Doughnut
                data={categoryChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '65%',
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: { color: chartColors.text, padding: 16, usePointStyle: true }
                    }
                  }
                }}
              />
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <p>Sin datos</p>
              </div>
            )}
          </div>
        </div>

        {/* Day of Week */}
        <div className="chart-card">
          <h3 className="chart-title">Gastos por Día de la Semana</h3>
          <div style={{ height: 280 }}>
            <Bar
              data={dayChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { display: false }, ticks: { color: chartColors.text } },
                  y: { grid: { color: chartColors.grid }, ticks: { color: chartColors.text } }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      {analytics.sortedMonths.length > 0 && (
        <div className="chart-card-full">
          <h3 className="chart-title">Tendencia Mensual</h3>
          <div style={{ height: 280 }}>
            <Line
              data={monthlyChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { color: chartColors.grid }, ticks: { color: chartColors.text } },
                  y: { grid: { color: chartColors.grid }, ticks: { color: chartColors.text } }
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Analytics;
