import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { getExpenses } from '../services/api';
import logger from '../utils/logger';
import { useCountUp } from '../hooks/useCountUp';
import GamificationPanel from '../components/ui/GamificationPanel';
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

// Brutalist palette — electric green forward
const CHART_COLORS = [
  '#43e97b', '#38f9d7', '#2fe8a0', '#7dffb0',
  '#fbbf24', '#f5576c', '#38bdf8', '#a0a0c0',
];
const CHART_COLORS_ALPHA = CHART_COLORS.map(c => c + '25');

function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const expRes = await getExpenses();
      setExpenses(expRes.data);
    } catch (err) {
      logger.apiError('Error fetching expenses', err);
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

  // -- KPI calculations with useMemo --
  const kpiData = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const avgExpense = expenses.length ? totalExpenses / expenses.length : 0;

    const categoryMap = {};
    expenses.forEach((exp) => {
      const category = exp.category || 'Sin categoría';
      categoryMap[category] = (categoryMap[category] || 0) + exp.amount;
    });

    const categories = Object.keys(categoryMap);
    const topCategory = categories.length
      ? categories.reduce((max, cat) => (categoryMap[cat] > categoryMap[max] ? cat : max))
      : '—';

    return {
      totalExpenses,
      avgExpense,
      categoryMap,
      categories,
      topCategory
    };
  }, [expenses]);

  // -- Monthly trends --
  const monthlyData = useMemo(() => {
    const monthlyMap = {};

    expenses.forEach((exp) => {
      const date = new Date(exp.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[key] = (monthlyMap[key] || 0) + exp.amount;
    });

    const sortedMonths = Object.keys(monthlyMap).sort();
    const last6Months = sortedMonths.slice(-6);

    return { monthlyMap, last6Months };
  }, [expenses]);

  // -- Doughnut chart --
  const doughnutData = useMemo(() => ({
    labels: kpiData.categories,
    datasets: [{
      data: kpiData.categories.map(cat => kpiData.categoryMap[cat]),
      backgroundColor: CHART_COLORS.slice(0, kpiData.categories.length),
      borderColor: 'transparent',
      borderWidth: 0,
      hoverOffset: 12,
    }],
  }), [kpiData]);

  const doughnutOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#a0a0c0',
          font: { family: 'DM Sans', size: 13, weight: '500' },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
    },
  }), []);

  // -- Line chart --
  const lineData = useMemo(() => ({
    labels: monthlyData.last6Months.map(month => {
      const [year, monthNum] = month.split('-');
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return `${monthNames[parseInt(monthNum) - 1]} '${year.slice(-2)}`;
    }),
    datasets: [{
      label: 'Gastos Mensuales',
      data: monthlyData.last6Months.map(month => monthlyData.monthlyMap[month] || 0),
      borderColor: '#43e97b',
      backgroundColor: 'rgba(67, 233, 123, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 6,
      pointBackgroundColor: '#43e97b',
      pointBorderColor: 'rgba(67, 233, 123, 0.3)',
      pointBorderWidth: 3,
      pointHoverRadius: 10,
    }],
  }), [monthlyData]);

  const lineOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(18, 18, 42, 0.9)',
        titleColor: '#f8f9ff',
        bodyColor: '#a0a0c0',
        borderColor: 'rgba(67, 233, 123, 0.4)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: {
          color: '#a0a0c0',
          font: { family: 'DM Sans', size: 12, weight: '500' }
        },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: {
          color: '#a0a0c0',
          font: { family: 'DM Sans', size: 12, weight: '500' },
          callback: value => '$' + value.toLocaleString('es-AR')
        },
      },
    },
  }), []);

  // -- Bar chart --
  const barData = useMemo(() => ({
    labels: kpiData.categories,
    datasets: [{
      label: 'Total por Categoría',
      data: kpiData.categories.map(cat => kpiData.categoryMap[cat]),
      backgroundColor: CHART_COLORS_ALPHA.slice(0, kpiData.categories.length),
      borderColor: CHART_COLORS.slice(0, kpiData.categories.length),
      borderWidth: 2,
      borderRadius: 8,
      borderSkipped: false,
    }],
  }), [kpiData]);

  const barOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(18, 18, 42, 0.9)',
        titleColor: '#f8f9ff',
        bodyColor: '#a0a0c0',
        borderColor: 'rgba(67, 233, 123, 0.4)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#a0a0c0',
          font: { family: 'DM Sans', size: 12, weight: '500' }
        },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: {
          color: '#a0a0c0',
          font: { family: 'DM Sans', size: 12, weight: '500' },
          callback: value => '$' + value.toLocaleString('es-AR')
        },
      },
    },
  }), []);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(value);

  // Animated KPI counters
  const animatedTotal = useCountUp(kpiData.totalExpenses);
  const animatedAvg = useCountUp(kpiData.avgExpense);
  const animatedCount = useCountUp(expenses.length);

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-container">
          <div className="dashboard-loading">
            <div className="spinner" />
            <p>Cargando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        {/* Header */}
        <div className="page-header">
          <div className="page-header-content">
            <h1>Dashboard</h1>
            <p className="page-subtitle">Resumen general de tus gastos</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon purple">💸</div>
            <div className="kpi-label">Total Gastos</div>
            <div className="kpi-value">{formatCurrency(animatedTotal)}</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon blue">📊</div>
            <div className="kpi-label">Promedio</div>
            <div className="kpi-value">{formatCurrency(animatedAvg)}</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon green">🏆</div>
            <div className="kpi-label">Categoría Top</div>
            <div className="kpi-value" style={{ fontSize: '1.5rem' }}>
              {kpiData.topCategory}
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon orange">📋</div>
            <div className="kpi-label">Transacciones</div>
            <div className="kpi-value">{Math.round(animatedCount)}</div>
          </div>
        </div>

        {/* Gamification */}
        <GamificationPanel expenses={expenses} />

        {/* Charts Grid */}
        <div className="charts-grid">
          <div className="chart-card">
            <div className="chart-card-title">📈 Distribución por Categoría</div>
            <div style={{ height: 300 }}>
              {kpiData.categories.length > 0 ? (
                <Doughnut data={doughnutData} options={doughnutOptions} />
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  <p>Sin datos todavía</p>
                  {expenses.length === 0 && (
                    <p className="empty-state-sub">Agregá tus primeros gastos para ver estadísticas</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-card-title">📉 Tendencia Mensual</div>
            <div style={{ height: 300 }}>
              {monthlyData.last6Months.length > 0 ? (
                <Line data={lineData} options={lineOptions} />
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  <p>Sin datos todavía</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        {kpiData.categories.length > 0 && (
          <div className="chart-card" style={{ marginBottom: 40 }}>
            <div className="chart-card-title">📊 Total por Categoría</div>
            <div style={{ height: 280 }}>
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
