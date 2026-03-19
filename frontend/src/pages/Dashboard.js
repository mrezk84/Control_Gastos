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
import { getAllExpenses } from '../services/api';
import logger from '../utils/logger';

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

// Premium chart colors
const CHART_COLORS = [
  '#8b5cf6', '#4facfe', '#f093fb', '#43e97b',
  '#fbbf24', '#f5576c', '#00f2fe', '#667eea',
];
const CHART_COLORS_ALPHA = CHART_COLORS.map(c => c + '30');

function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const expRes = await getAllExpenses();
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

  // -- KPI calculations --
  const kpiData = useMemo(() => {
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const avgExpense = expenses.length ? totalExpenses / expenses.length : 0;

    const categoryMap = {};
    expenses.forEach((e) => {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
    });
    const categories = Object.keys(categoryMap);
    const topCategory = categories.length
      ? categories.reduce((a, b) => (categoryMap[a] > categoryMap[b] ? a : b))
      : '—';

    return { totalExpenses, avgExpense, categoryMap, categories, topCategory };
  }, [expenses]);

  // -- Monthly trends --
  const monthlyData = useMemo(() => {
    const monthlyMap = {};
    expenses.forEach((e) => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[key] = (monthlyMap[key] || 0) + e.amount;
    });
    const sortedMonths = Object.keys(monthlyMap).sort();
    const last6Months = sortedMonths.slice(-6);
    return { monthlyMap, last6Months };
  }, [expenses]);

  // -- Doughnut data --
  const doughnutData = useMemo(() => ({
    labels: kpiData.categories,
    datasets: [
      {
        data: kpiData.categories.map((c) => kpiData.categoryMap[c]),
        backgroundColor: CHART_COLORS.slice(0, kpiData.categories.length),
        borderColor: 'transparent',
        borderWidth: 0,
        hoverOffset: 8,
      },
    ],
  }), [kpiData]);

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#a0a0c0', font: { family: 'Inter', size: 12 }, padding: 16, usePointStyle: true, pointStyleWidth: 8 },
      },
    },
  };

  // -- Line chart data --
  const lineData = useMemo(() => ({
    labels: monthlyData.last6Months.map((m) => {
      const [y, mo] = m.split('-');
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return `${monthNames[parseInt(mo) - 1]} ${y.slice(2)}`;
    }),
    datasets: [
      {
        label: 'Gastos Mensuales',
        data: monthlyData.last6Months.map((m) => monthlyData.monthlyMap[m] || 0),
        borderColor: '#4facfe',
        backgroundColor: 'rgba(79, 172, 254, 0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: '#4facfe',
        pointBorderColor: 'rgba(79, 172, 254, 0.3)',
        pointBorderWidth: 3,
        pointHoverRadius: 8,
      },
    ],
  }), [monthlyData]);

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#a0a0c0', font: { family: 'Inter', size: 11 } },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#a0a0c0', font: { family: 'Inter', size: 11 }, callback: (v) => '$' + v.toLocaleString() },
      },
    },
  };

  // -- Bar chart data --
  const barData = useMemo(() => ({
    labels: kpiData.categories,
    datasets: [
      {
        label: 'Total por Categoría',
        data: kpiData.categories.map((c) => kpiData.categoryMap[c]),
        backgroundColor: CHART_COLORS_ALPHA.slice(0, kpiData.categories.length),
        borderColor: CHART_COLORS.slice(0, kpiData.categories.length),
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  }), [kpiData]);

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#a0a0c0', font: { family: 'Inter', size: 11 } },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#a0a0c0', font: { family: 'Inter', size: 11 }, callback: (v) => '$' + v.toLocaleString() },
      },
    },
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" />
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">👋 Dashboard</h1>
          <p className="page-subtitle">Resumen general de tus gastos</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon purple">💸</div>
          <div className="kpi-label">Total Gastos</div>
          <div className="kpi-value">{formatCurrency(kpiData.totalExpenses)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon blue">📊</div>
          <div className="kpi-label">Promedio</div>
          <div className="kpi-value">{formatCurrency(kpiData.avgExpense)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon green">🏆</div>
          <div className="kpi-label">Categoría Top</div>
          <div className="kpi-value" style={{ fontSize: '1.3rem' }}>{kpiData.topCategory}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon orange">📋</div>
          <div className="kpi-label">Transacciones</div>
          <div className="kpi-value">{expenses.length}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-card-title">📈 Distribución por Categoría</div>
          <div style={{ height: 280 }}>
            {kpiData.categories.length > 0 ? (
              <Doughnut data={doughnutData} options={doughnutOptions} />
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <p>Sin datos todavía</p>
              </div>
            )}
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-card-title">📉 Tendencia Mensual</div>
          <div style={{ height: 280 }}>
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
        <div className="chart-card" style={{ marginBottom: 32, animationDelay: '0.45s' }}>
          <div className="chart-card-title">📊 Total por Categoría</div>
          <div style={{ height: 260 }}>
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
