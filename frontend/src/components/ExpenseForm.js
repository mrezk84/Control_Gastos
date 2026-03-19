import React, { useState } from 'react';
import { createExpense } from '../services/api';
import logger from '../utils/logger';

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

function ExpenseForm({ setExpenses }) {
  const [expense, setExpense] = useState({ description: '', amount: '', category: '', date: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!expense.description || !expense.amount || !expense.category || !expense.date) return;
    setLoading(true);
    try {
      const response = await createExpense({ ...expense, amount: parseFloat(expense.amount) });
      setExpenses((prev) => [...prev, response.data]);
      setExpense({ description: '', amount: '', category: '', date: '' });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      logger.apiError('Error al crear gasto', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="expense-form-card">
      <div className="expense-form-title">
        ➕ Agregar Gasto
        {success && <span style={{ color: 'var(--accent-green)', fontSize: '0.85rem', fontWeight: 400 }}>✓ Guardado</span>}
      </div>
      <form onSubmit={handleSubmit}>
        <div className="expense-form-grid">
          <div className="form-group-dark">
            <label htmlFor="exp-description">Descripción</label>
            <input
              id="exp-description"
              className="input-dark"
              type="text"
              placeholder="¿En qué gastaste?"
              value={expense.description}
              onChange={(e) => setExpense({ ...expense, description: e.target.value })}
            />
          </div>
          <div className="form-group-dark">
            <label htmlFor="exp-amount">Monto</label>
            <input
              id="exp-amount"
              className="input-dark"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={expense.amount}
              onChange={(e) => setExpense({ ...expense, amount: e.target.value })}
            />
          </div>
          <div className="form-group-dark">
            <label htmlFor="exp-category">Categoría</label>
            <select
              id="exp-category"
              className="select-dark"
              value={expense.category}
              onChange={(e) => setExpense({ ...expense, category: e.target.value })}
            >
              <option value="">Seleccioná</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="form-group-dark">
            <label htmlFor="exp-date">Fecha</label>
            <input
              id="exp-date"
              className="input-dark"
              type="date"
              value={expense.date}
              onChange={(e) => setExpense({ ...expense, date: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn-add-expense" type="submit" disabled={loading}>
              {loading ? 'Guardando...' : '+ Agregar'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default ExpenseForm;