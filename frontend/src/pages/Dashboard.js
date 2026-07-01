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

// Refined palette - emerald, teal & champagne on graphite
const CHART_COLORS = [
  '#10b981', '#22d3ee', '#d8b878', '#34d399',
  '#f59e0b', '#f43f5e', '#38bdf8', '#2dd4bf',
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
          font: { family: 'Plus Jakarta Sans', size: 13, weight: '500' },
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
      borderColor: '#06b6d4',
      backgroundColor: 'rgba(6, 182, 212, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 6,
      pointBackgroundColor: '#06b6d4',
      pointBorderColor: 'rgba(6, 182, 212, 0.3)',
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
        backgroundColor: 'rgba(18, 23, 30, 0.9)',
        titleColor: '#f8f9ff',
        bodyColor: '#a0a0c0',
        borderColor: 'rgba(16, 185, 129, 0.3)',
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
          font: { family: 'Plus Jakarta Sans', size: 12, weight: '500' }
        },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: {
          color: '#a0a0c0',
          font: { family: 'Plus Jakarta Sans', size: 12, weight: '500' },
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
        backgroundColor: 'rgba(18, 23, 30, 0.9)',
        titleColor: '#f8f9ff',
        bodyColor: '#a0a0c0',
        borderColor: 'rgba(16, 185, 129, 0.3)',
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
          font: { family: 'Plus Jakarta Sans', size: 12, weight: '500' }
        },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: {
          color: '#a0a0c0',
          font: { family: 'Plus Jakarta Sans', size: 12, weight: '500' },
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
            <div className="kpi-value" style={{ fontSize: '1.5rem' }}>
              {kpiData.topCategory}
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon orange">📋</div>
            <div className="kpi-label">Transacciones</div>
            <div className="kpi-value">{expenses.length}</div>
          </div>
        </div>

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
