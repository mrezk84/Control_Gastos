import React, { useState } from 'react';
import { updateExpense, deleteExpense } from '../services/api';
import logger from '../utils/logger';

const CATEGORY_CLASSES = {
  'Alimentación': 'food',
  'Transporte': 'transport',
  'Entretenimiento': 'entertainment',
  'Salud': 'health',
  'Servicios': 'services',
};

const CATEGORIES = [
  'Alimentación',
  'Transporte',
  'Entretenimiento',
  'Salud',
  'Servicios',
  'Educación',
  'Vivienda',
  'Ropa',
  'Tecnología',
  'Otros',
];

function ExpenseList({ expenses, setExpenses }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const formatCurrency = (val) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const startEdit = (expense) => {
    setEditingId(expense.id);
    setEditForm({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
    });
    setDeleteConfirm(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
    setDeleteConfirm(null);
  };

  const handleEditChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const saveEdit = async (id) => {
    if (!editForm.description || !editForm.amount || !editForm.category || !editForm.date) return;
    setLoading(true);
    try {
      const response = await updateExpense(id, { ...editForm, amount: parseFloat(editForm.amount) });
      setExpenses(prev => prev.map(e => e.id === id ? response.data : e));
      setEditingId(null);
      setEditForm({});
    } catch (err) {
      logger.apiError('Error al actualizar gasto', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      return;
    }
    setLoading(true);
    try {
      await deleteExpense(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
      setDeleteConfirm(null);
      setEditingId(null);
    } catch (err) {
      logger.apiError('Error al eliminar gasto', err);
    } finally {
      setLoading(false);
    }
  };

  if (!expenses.length) {
    return (
      <div className="expense-table-card">
        <div className="expense-table-title">📋 Últimos Gastos</div>
        <div className="empty-state">
          <div className="empty-state-icon">💭</div>
          <p>Todavía no tenés gastos registrados. ¡Agregá el primero!</p>
        </div>
      </div>
    );
  }

  // Show most recent first
  const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="expense-table-card">
      <div className="expense-table-title">📋 Últimos Gastos ({expenses.length})</div>
      <table className="expense-table">
        <thead>
          <tr>
            <th>Descripción</th>
            <th>Monto</th>
            <th>Categoría</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((expense, index) => (
            <tr key={expense.id} style={{ animationDelay: `${index * 0.05}s` }}>
              {editingId === expense.id ? (
                <>
                  <td>
                    <input
                      type="text"
                      className="edit-input"
                      value={editForm.description}
                      onChange={(e) => handleEditChange('description', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="edit-input edit-input-number"
                      value={editForm.amount}
                      onChange={(e) => handleEditChange('amount', e.target.value)}
                      step="0.01"
                      min="0"
                    />
                  </td>
                  <td>
                    <select
                      className="edit-input edit-select"
                      value={editForm.category}
                      onChange={(e) => handleEditChange('category', e.target.value)}
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="date"
                      className="edit-input"
                      value={editForm.date}
                      onChange={(e) => handleEditChange('date', e.target.value)}
                    />
                  </td>
                  <td>
                    <div className="expense-actions">
                      <button
                        className="btn-action btn-save"
                        onClick={() => saveEdit(expense.id)}
                        disabled={loading}
                        title="Guardar cambios"
                      >
                        ✓
                      </button>
                      <button
                        className="btn-action btn-cancel"
                        onClick={cancelEdit}
                        disabled={loading}
                        title="Cancelar"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </>
              ) : (
                <>
                  <td>{expense.description}</td>
                  <td className="amount-cell">{formatCurrency(expense.amount)}</td>
                  <td>
                    <span className={`category-badge ${CATEGORY_CLASSES[expense.category] || ''}`}>
                      {expense.category}
                    </span>
                  </td>
                  <td className="date-cell">{formatDate(expense.date)}</td>
                  <td>
                    <div className="expense-actions">
                      <button
                        className="btn-action btn-edit"
                        onClick={() => startEdit(expense)}
                        disabled={loading}
                        title="Editar gasto"
                      >
                        ✏️
                      </button>
                      <button
                        className={`btn-action btn-delete ${deleteConfirm === expense.id ? 'confirm' : ''}`}
                        onClick={() => handleDelete(expense.id)}
                        disabled={loading}
                        title={deleteConfirm === expense.id ? 'Confirmar eliminación' : 'Eliminar gasto'}
                      >
                        {deleteConfirm === expense.id ? '🗑️' : '🗑'}
                      </button>
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ExpenseList;