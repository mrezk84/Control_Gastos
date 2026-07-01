import React, { useState, useEffect, useCallback } from 'react';
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
  '#10b981', '#22d3ee', '#d8b878', '#34d399',
  '#f59e0b', '#f43f5e', '#38bdf8', '#2dd4bf',
];
const CHART_COLORS_ALPHA = CHART_COLORS.map(c => c + '30');

function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [user, setUser] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      const [expRes, userRes] = await Promise.all([
        getExpenses(),
        getCurrentUser().catch(() => null),
      ]);
      setExpenses(expRes.data);
      if (userRes) setUser(userRes.data);
    } catch (err) {
      localStorage.removeItem('token');
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // -- KPI calculations --
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

  // -- Monthly trends --
  const monthlyMap = {};
  expenses.forEach((e) => {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap[key] = (monthlyMap[key] || 0) + e.amount;
  });
  const sortedMonths = Object.keys(monthlyMap).sort();
  const last6Months = sortedMonths.slice(-6);

  // -- Doughnut data --
  const doughnutData = {
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
  };

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
  const lineData = {
    labels: last6Months.map((m) => {
      const [y, mo] = m.split('-');
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return `${monthNames[parseInt(mo) - 1]} ${y.slice(2)}`;
    }),
    datasets: [
      {
        label: 'Gastos Mensuales',
        data: last6Months.map((m) => monthlyMap[m] || 0),
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(79, 172, 254, 0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: '#22d3ee',
        pointBorderColor: 'rgba(79, 172, 254, 0.3)',
        pointBorderWidth: 3,
        pointHoverRadius: 8,
      },
    ],
  };

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
  const barData = {
    labels: categories,
    datasets: [
      {
        label: 'Total por Categoría',
        data: categories.map((c) => categoryMap[c]),
        backgroundColor: CHART_COLORS_ALPHA.slice(0, categories.length),
        borderColor: CHART_COLORS.slice(0, categories.length),
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const userInitial = user ? (user.username || user.email || '?')[0].toUpperCase() : '?';

  const formatCurrency = (val) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="dashboard-page">
      <div className="animated-bg" />

      {/* Navbar */}
      <nav className="dash-navbar modern-glass">
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
          <div className="kpi-card modern-glass kpi-purple">
            <div className="kpi-icon">💸</div>
            <div className="kpi-label">Total Gastos</div>
            <div className="kpi-value">{formatCurrency(totalExpenses)}</div>
            <div className="kpi-sparkline" />
          </div>
          <div className="kpi-card modern-glass kpi-blue">
            <div className="kpi-icon">📊</div>
            <div className="kpi-label">Promedio</div>
            <div className="kpi-value">{formatCurrency(avgExpense)}</div>
            <div className="kpi-sparkline" />
          </div>
          <div className="kpi-card modern-glass kpi-green">
            <div className="kpi-icon">🏆</div>
            <div className="kpi-label">Categoría Top</div>
            <div className="kpi-value" style={{ fontSize: '1.3rem' }}>{topCategory}</div>
            <div className="kpi-sparkline" />
          </div>
          <div className="kpi-card modern-glass kpi-orange">
            <div className="kpi-icon">📋</div>
            <div className="kpi-label">Transacciones</div>
            <div className="kpi-value">{expenses.length}</div>
            <div className="kpi-sparkline" />
          </div>
        </div>

        {/* Charts */}
        <div className="charts-grid">
          <div className="chart-card modern-glass">
            <div className="chart-card-title">📈 Distribución por Categoría</div>
            <div style={{ height: 280 }}>
              {categories.length > 0 ? (
                <Doughnut data={doughnutData} options={doughnutOptions} />
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  <p>Sin datos todavía</p>
                </div>
              )}
            </div>
          </div>
          <div className="chart-card modern-glass">
            <div className="chart-card-title">📉 Tendencia Mensual</div>
            <div style={{ height: 280 }}>
              {last6Months.length > 0 ? (
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
        {categories.length > 0 && (
          <div className="chart-card modern-glass" style={{ marginBottom: 32 }}>
            <div className="chart-card-title">📊 Total por Categoría</div>
            <div style={{ height: 260 }}>
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
        )}

        {/* Expense Form */}
        <ExpenseForm
          setExpenses={setExpenses}
          editingExpense={editingExpense}
          setEditingExpense={setEditingExpense}
        />

        {/* Expense List */}
        <ExpenseList
          expenses={expenses}
          setExpenses={setExpenses}
          onEdit={handleEditExpense}
        />
      </div>
    </div>
  );
}

export default Dashboard;