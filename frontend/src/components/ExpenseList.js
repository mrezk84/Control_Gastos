import React, { useState } from 'react';
import { deleteExpense } from '../services/api';

const CATEGORY_STYLES = {
  'Alimentación': { bg: '#fee2e2', text: '#991b1b', icon: '🍔' },
  'Transporte': { bg: '#dbeafe', text: '#1e40af', icon: '🚗' },
  'Entretenimiento': { bg: '#fce7f3', text: '#9d174d', icon: '🎬' },
  'Salud': { bg: '#dcfce7', text: '#166534', icon: '💊' },
  'Servicios': { bg: '#fef3c7', text: '#92400e', icon: '💡' },
  'Educación': { bg: '#e0e7ff', text: '#3730a3', icon: '📚' },
  'Vivienda': { bg: '#f3e8ff', text: '#6b21a8', icon: '🏠' },
  'Ropa': { bg: '#ffe4e6', text: '#be123c', icon: '👕' },
  'Tecnología': { bg: '#ccfbf1', text: '#115e59', icon: '📱' },
  'Otros': { bg: '#f1f5f9', text: '#475569', icon: '📦' },
};

function ExpenseList({ expenses, setExpenses, onEdit }) {
  const [deletingId, setDeletingId] = useState(null);

  const formatCurrency = (val) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteExpense(id);
      setExpenses((prev) => prev.filter((exp) => exp.id !== id));
    } catch (err) {
      console.error('Error al eliminar gasto');
    } finally {
      setDeletingId(null);
    }
  };

  if (!expenses.length) {
    return (
      <div className="expense-table-card modern-glass">
        <div className="expense-table-title">📋 Últimos Gastos</div>
        <div className="empty-state">
          <div className="empty-state-icon">💭</div>
          <p>Todavía no tenés gastos registrados.</p>
          <p className="empty-state-sub">¡Agregá el primero o escaneá un recibo!</p>
        </div>
      </div>
    );
  }

  const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="expense-table-card modern-glass">
      <div className="expense-table-title">
        📋 Últimos Gastos
        <span className="expense-count">{expenses.length}</span>
      </div>
      <div className="expense-list-mobile">
        {sorted.map((expense, index) => {
          const style = CATEGORY_STYLES[expense.category] || CATEGORY_STYLES['Otros'];
          return (
            <div key={expense.id} className="expense-item-mobile" style={{ animationDelay: `${index * 0.05}s` }}>
              <div className="expense-item-header">
                <div className="expense-item-icon">{style.icon}</div>
                <div className="expense-item-info">
                  <h4>{expense.description}</h4>
                  <span
                    className="category-badge"
                    style={{ backgroundColor: style.bg, color: style.text }}
                  >
                    {expense.category}
                  </span>
                </div>
                <div className="expense-item-amount">
                  {formatCurrency(expense.amount)}
                </div>
              </div>
              <div className="expense-item-footer">
                <span className="expense-date">{formatDate(expense.date)}</span>
                <div className="expense-actions">
                  {expense.receipt_url && (
                    <span className="receipt-indicator" title="Tiene recibo adjunto">📎</span>
                  )}
                  <button
                    className="btn-action btn-edit"
                    onClick={() => onEdit(expense)}
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-action btn-delete"
                    onClick={() => handleDelete(expense.id)}
                    disabled={deletingId === expense.id}
                    title="Eliminar"
                  >
                    {deletingId === expense.id ? '⏳' : '🗑️'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ExpenseList;