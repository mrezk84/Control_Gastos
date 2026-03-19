import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import ExpenseForm from './ExpenseForm';
import ExpenseList from './ExpenseList';
import { getExpenses, getCurrentUser } from '../services/api';
import { formatCurrency, CATEGORIES, CHART_COLORS } from '../utils';

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

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [expRes, userRes] = await Promise.all([
        getExpenses(),
        getCurrentUser().catch(() => null),
      ]);
      setExpenses(expRes.data);
      if (userRes) setUser(userRes.data);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Error al cargar los datos';
      setError(errorMsg);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Memoized calculations to avoid unnecessary re-renders
  const { totalExpenses, avgExpense, categoryMap, topCategory } = useMemo(() => {
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const avg = expenses.length ? total / expenses.length : 0;

    const catMap = {};
    expenses.forEach((expense) => {
      catMap[expense.category] = (catMap[expense.category] || 0) + expense.amount;
    });

    const categories = Object.keys(catMap);
    const topCat = categories.length
      ? categories.reduce((a, b) => (catMap[a] > catMap[b] ? a : b))
      : null;

    return {
      totalExpenses: total,
      avgExpense: avg,
      categoryMap: catMap,
      topCategory: topCat,
    };
  }, [expenses]);

  const { monthlyMap, last6Months } = useMemo(() => {
    const map = {};
    expenses.forEach((expense) => {
      const d = new Date(expense.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[key] = (map[key] || 0) + expense.amount;
    });
    const sorted = Object.keys(map).sort();
    return {
      monthlyMap: map,
      last6Months: sorted.slice(-6),
    };
  }, [expenses]);

  const categories = useMemo(() => Object.keys(categoryMap), [categoryMap]);

  // Chart data
  const doughnutData = useMemo(() => ({
    labels: categories,
    datasets: [
      {
        data: categories.map((c) => categoryMap[c]),
        backgroundColor: CHART_COLORS.slice(0, categories.length),
        borderColor: 'transparent',
        borderWidth: 0,
        hoverOffset: 8,
      },
    ],
  }), [categories, categoryMap]);

  const lineData = useMemo(() => ({
    labels: last6Months.map((m) => {
      const [y, mo] = m.split('-');
      return `${MONTH_NAMES[parseInt(mo) - 1]} ${y.slice(2)}`;
    }),
    datasets: [
      {
        label: 'Gastos Mensuales',
        data: last6Months.map((m) => monthlyMap[m] || 0),
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
  }), [last6Months, monthlyMap]);

  const barData = useMemo(() => ({
    labels: categories,
    datasets: [
      {
        label: 'Total por Categoría',
        data: categories.map((c) => categoryMap[c]),
        backgroundColor: CHART_COLORS.slice(0, categories.length).map(c => c + '30'),
        borderColor: CHART_COLORS.slice(0, categories.length),
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  }), [categories, categoryMap]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const userInitial = user ? (user.username || user.email || '?')[0].toUpperCase() : '?';

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="animated-bg" />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="animated-bg" />

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={fetchData} className="btn-retry">Reintentar</button>
        </div>
      )}

      {/* Navbar */}
      <nav className="dash-navbar">
        <div className="dash-navbar-brand">
          <div className="dash-navbar-logo">💰</div>
          <span className="dash-navbar-title">Control de Gastos</span>
        </div>
        <div className="dash-navbar-user">
          <span className="dash-navbar-username">{user?.username || 'Usuario'}</span>
          <div className="dash-navbar-avatar">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="avatar" />
            ) : (
              userInitial
            )}
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            Cerrar Sesión
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="dash-content">
        <div className="dash-header">
          <h1>👋 Hola, {user?.username || 'Usuario'}</h1>
          <p>Acá tenés un resumen de tus gastos.</p>
        </div>

        {/* KPI Cards */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon purple">💸</div>
            <div className="kpi-label">Total Gastos</div>
            <div className="kpi-value">{formatCurrency(totalExpenses)}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon blue">📊</div>
            <div className="kpi-label">Promedio</div>
            <div className="kpi-value">{formatCurrency(avgExpense)}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon green">🏆</div>
            <div className="kpi-label">Categoría Top</div>
            <div className="kpi-value" style={{ fontSize: '1.3rem' }}>{topCategory || '—'}</div>
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
              {categories.length > 0 ? (
                <Doughnut data={doughnutData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '68%',
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        color: '#a0a0c0',
                        font: { family: 'Inter', size: 12 },
                        padding: 16,
                        usePointStyle: true,
                        pointStyleWidth: 8
                      },
                    },
                  },
                }} />
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
              {last6Months.length > 0 ? (
                <Line data={lineData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
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
                }} />
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
        {categories.length > 0 && (
          <div className="chart-card" style={{ marginBottom: 32 }}>
            <div className="chart-card-title">📊 Total por Categoría</div>
            <div style={{ height: 260 }}>
              <Bar data={barData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
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
              }} />
            </div>
          </div>
        )}

        {/* Expense Form */}
        <ExpenseForm setExpenses={setExpenses} />

        {/* Expense List */}
        <ExpenseList expenses={expenses} setExpenses={setExpenses} />
      </div>
    </div>
  );
}

export default Dashboard;
