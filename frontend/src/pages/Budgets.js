import React, { useState, useEffect, useCallback } from 'react';
import { getBudgetsProgress, createBudget, updateBudget, deleteBudget, getAllExpenses, createExpense } from '../services/api';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import logger from '../utils/logger';
import { useToast } from '../components/ui/ToastContainer';

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

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [todayExpenses, setTodayExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear] = useState(new Date().getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [showQuickExpenseModal, setShowQuickExpenseModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    is_recurring: false,
  });
  const [expenseData, setExpenseData] = useState({
    description: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState(null);
  const { success, error, warning } = useToast();

  // Fetch budgets with progress
  const fetchBudgets = useCallback(async () => {
    try {
      const res = await getBudgetsProgress(currentMonth, currentYear);
      setBudgets(res.data.budgets || []);
    } catch (err) {
      logger.apiError('Error fetching budgets', err);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);

  // Fetch today's expenses
  const fetchTodayExpenses = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await getAllExpenses({ startDate: today, endDate: today });
      setTodayExpenses(res.data || []);
    } catch (err) {
      logger.apiError('Error fetching today expenses', err);
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
    fetchTodayExpenses();
  }, [fetchBudgets, fetchTodayExpenses]);

  const handleSave = async (e) => {
    e.preventDefault();

    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      warning('⚠️ El monto debe ser mayor a 0');
      return;
    }

    if (!formData.category) {
      warning('⚠️ Seleccioná una categoría');
      return;
    }

    if (!editingBudget) {
      const existingBudget = budgets.find(b => b.category === formData.category);
      if (existingBudget) {
        warning(
          `⚠️ Ya tenés un presupuesto de "${formData.category}" para ${MONTHS[currentMonth - 1]} ${currentYear}. ` +
          `Monto actual: $${existingBudget.budget_amount} - Gastado: $${existingBudget.spent_amount}`
        );
        return;
      }
    }

    try {
      const data = {
        category: formData.category,
        amount: amount,
        month: currentMonth,
        year: currentYear,
        is_recurring: formData.is_recurring,
      };

      if (editingBudget) {
        await updateBudget(editingBudget.id, data);
      } else {
        await createBudget(data);
      }

      closeModal();
      setEditingBudget(null);
      setFormData({ category: '', amount: '', is_recurring: false });
      await fetchBudgets();
      success(editingBudget ? '✏️ Presupuesto actualizado' : '✅ Presupuesto creado');
    } catch (err) {
      logger.apiError('Error saving budget', err);
      let errorMessage = 'Error al guardar el presupuesto';
      if (err.response?.data?.detail) errorMessage = err.response.data.detail;
      else if (err.message) errorMessage = err.message;
      error('⚠️ ' + errorMessage);
    }
  };

  // Handle quick expense add
  const handleQuickExpense = async (e) => {
    e.preventDefault();

    const amount = parseFloat(expenseData.amount);
    if (!expenseData.amount || isNaN(amount) || amount <= 0) {
      warning('⚠️ El monto debe ser mayor a 0');
      return;
    }

    if (!expenseData.description.trim()) {
      warning('⚠️ Ingresá una descripción');
      return;
    }

    if (!expenseData.category) {
      warning('⚠️ Seleccioná una categoría');
      return;
    }

    try {
      await createExpense({
        description: expenseData.description,
        amount: amount,
        category: expenseData.category,
        date: expenseData.date,
      });

      closeQuickExpenseModal();
      await fetchTodayExpenses();
      await fetchBudgets();
      success('💸 Gasto agregado correctamente');
    } catch (err) {
      logger.apiError('Error adding expense', err);
      error('⚠️ Error al agregar el gasto');
    }
  };

  const handleEdit = (budget) => {
    // Create a normalized budget object with 'id' property
    const normalizedBudget = {
      ...budget,
      id: budget.budget_id, // Map budget_id to id for consistency
    };
    setEditingBudget(normalizedBudget);
    setFormData({
      category: budget.category,
      amount: budget.budget_amount,
      is_recurring: false,
    });
    setShowModal(true);
  };

  const handleDeleteClick = (budget) => {
    setBudgetToDelete(budget.budget_id);
    setShowConfirmDialog(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!budgetToDelete) return;

    try {
      await deleteBudget(budgetToDelete);
      await fetchBudgets();
      success('🗑️ Presupuesto eliminado');
    } catch (err) {
      logger.apiError('Error deleting budget', err);
      error('❌ Error al eliminar el presupuesto');
    } finally {
      setBudgetToDelete(null);
    }
  };

  const openNewModal = () => {
    setEditingBudget(null);
    setFormData({ category: '', amount: '', is_recurring: false });
    setShowModal(true);
  };

  const openQuickExpenseModal = (category = '') => {
    setExpenseData({
      description: '',
      amount: '',
      category: category,
      date: new Date().toISOString().split('T')[0],
    });
    setShowQuickExpenseModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBudget(null);
    setFormData({ category: '', amount: '', is_recurring: false });
  };

  const closeQuickExpenseModal = () => {
    setShowQuickExpenseModal(false);
    setExpenseData({ description: '', amount: '', category: '', date: new Date().toISOString().split('T')[0] });
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'red';
    if (percentage >= 80) return 'orange';
    return 'green';
  };

  const getProgressWidth = (percentage) => Math.min(percentage, 100);

  // Calculate totals
  const totalBudget = budgets.reduce((sum, b) => sum + b.budget_amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent_amount, 0);
  const totalRemaining = totalBudget - totalSpent;
  const totalPercentage = totalBudget > 0 ? (totalSpent / totalBudget * 100) : 0;
  const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  if (loading) {
    return (
      <div className="budgets-loading">
        <div className="spinner" />
        <p>Cargando presupuestos...</p>
      </div>
    );
  }

  return (
    <div className="budgets-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">🎯 Presupuestos</h1>
          <p className="page-subtitle">
            {MONTHS[currentMonth - 1]} {currentYear}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => openQuickExpenseModal()}>
            + Gasto Rápido
          </button>
          <button className="btn btn-primary" onClick={openNewModal}>
            + Nuevo Presupuesto
          </button>
        </div>
      </div>

      {/* Today's Summary Card */}
      <div className="today-summary-card">
        <div className="today-summary-header">
          <div className="today-summary-icon">📅</div>
          <div className="today-summary-title">
            <h3>Compras de Hoy</h3>
            <p>{new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="today-summary-amount">
            <span className="today-summary-label">Total del día</span>
            <span className="today-summary-value">{formatCurrency(todayTotal)}</span>
          </div>
        </div>

        {todayExpenses.length > 0 ? (
          <div className="today-expenses-list">
            {todayExpenses.map((expense) => {
              const budget = budgets.find(b => b.category === expense.category);
              const remaining = budget ? budget.remaining_amount : null;

              return (
                <div key={expense.id} className="today-expense-item">
                  <div className="today-expense-info">
                    <div className="today-expense-category">{expense.category}</div>
                    <div className="today-expense-description">{expense.description}</div>
                    {remaining !== null && (
                      <div className={`today-expense-budget ${remaining < 0 ? 'over-budget' : ''}`}>
                        {remaining < 0 ? `⚠️ Excedido por ${formatCurrency(Math.abs(remaining))}` : `📊 Queda ${formatCurrency(remaining)}`}
                      </div>
                    )}
                  </div>
                  <div className="today-expense-amount">-{formatCurrency(expense.amount)}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="today-expenses-empty">
            <p>No hay compras registradas hoy</p>
            <button className="btn btn-ghost" onClick={() => openQuickExpenseModal()}>
              + Agregar primer gasto
            </button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="budgets-summary">
        <div className="budget-summary-card">
          <div className="budget-summary-label">Presupuesto Total</div>
          <div className="budget-summary-value">{formatCurrency(totalBudget)}</div>
        </div>
        <div className="budget-summary-card">
          <div className="budget-summary-label">Gastado</div>
          <div className="budget-summary-value budget-summary-value-spent">
            {formatCurrency(totalSpent)}
          </div>
        </div>
        <div className="budget-summary-card">
          <div className="budget-summary-label">Disponible</div>
          <div className={`budget-summary-value ${totalRemaining < 0 ? 'budget-summary-value-over' : 'budget-summary-value-remaining'}`}>
            {formatCurrency(Math.abs(totalRemaining))}
          </div>
        </div>
        <div className="budget-summary-card">
          <div className="budget-summary-label">Progreso</div>
          <div className={`budget-summary-value budget-summary-value-${getProgressColor(totalPercentage)}`}>
            {totalPercentage.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Budget List */}
      {budgets.length === 0 ? (
        <EmptyState
          icon="💰"
          title="Sin presupuestos"
          description="No tenés presupuestos configurados para este mes. Creá uno para controlar tus gastos."
          action={
            <button className="btn btn-primary" onClick={openNewModal}>
              + Crear Presupuesto
            </button>
          }
        />
      ) : (
        <div className="budgets-list">
          {budgets.map((budget) => (
            <div key={budget.budget_id} className="budget-card">
              <div className="budget-header">
                <div className="budget-category">{budget.category}</div>
                <div className="budget-actions">
                  <button
                    className="budget-action-btn"
                    onClick={() => openQuickExpenseModal(budget.category)}
                    title="Agregar gasto rápido"
                  >
                    💸
                  </button>
                  <button
                    className="budget-action-btn"
                    onClick={() => handleEdit(budget)}
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    className="budget-action-btn budget-action-btn-delete"
                    onClick={() => handleDeleteClick(budget)}
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="budget-progress-bar">
                <div
                  className={`budget-progress-fill budget-progress-fill-${getProgressColor(budget.percentage)}`}
                  style={{ width: `${getProgressWidth(budget.percentage)}%` }}
                />
              </div>

              <div className="budget-details">
                <div className="budget-detail">
                  <span className="budget-detail-label">Presupuesto:</span>
                  <span className="budget-detail-value">{formatCurrency(budget.budget_amount)}</span>
                </div>
                <div className="budget-detail">
                  <span className="budget-detail-label">Gastado:</span>
                  <span className="budget-detail-value">{formatCurrency(budget.spent_amount)}</span>
                </div>
                <div className="budget-detail">
                  <span className="budget-detail-label">Restante:</span>
                  <span className={`budget-detail-value ${budget.remaining_amount < 0 ? 'budget-detail-over' : ''}`}>
                    {formatCurrency(Math.abs(budget.remaining_amount))}
                  </span>
                </div>
                <div className={`budget-percentage budget-percentage-${getProgressColor(budget.percentage)}`}>
                  {budget.percentage.toFixed(1)}%
                </div>
              </div>

              {budget.percentage >= 100 && (
                <div className="budget-warning">
                  ⚠️ Has excedido tu presupuesto en {budget.category}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Budget Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingBudget ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
      >
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Categoría</label>
            <select
              className="form-select"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            >
              <option value="">Seleccionar...</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Monto Mensual</label>
            <input
              type="number"
              className="form-input"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              min="0"
              step="0.01"
              placeholder="0.00"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-checkbox">
              <input
                type="checkbox"
                checked={formData.is_recurring}
                onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
              />
              <span>Repetir todos los meses</span>
            </label>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {editingBudget ? 'Guardar Cambios' : 'Crear Presupuesto'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Quick Expense Modal */}
      <Modal
        isOpen={showQuickExpenseModal}
        onClose={closeQuickExpenseModal}
        title="💸 Gasto Rápido"
      >
        <form onSubmit={handleQuickExpense}>
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <input
              type="text"
              className="form-input"
              value={expenseData.description}
              onChange={(e) => setExpenseData({ ...expenseData, description: e.target.value })}
              placeholder="Ej: Café, Supermercado..."
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Monto</label>
            <input
              type="number"
              className="form-input"
              value={expenseData.amount}
              onChange={(e) => setExpenseData({ ...expenseData, amount: e.target.value })}
              min="0"
              step="0.01"
              placeholder="0.00"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Categoría</label>
            <select
              className="form-select"
              value={expenseData.category}
              onChange={(e) => setExpenseData({ ...expenseData, category: e.target.value })}
              required
            >
              <option value="">Seleccionar...</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Fecha</label>
            <input
              type="date"
              className="form-input"
              value={expenseData.date}
              onChange={(e) => setExpenseData({ ...expenseData, date: e.target.value })}
              required
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeQuickExpenseModal}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Agregar Gasto
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleDeleteConfirmed}
        title="Eliminar Presupuesto"
        message={budgetToDelete ? `¿Estás seguro de eliminar el presupuesto de "${budgetToDelete.category}"? Esta acción no se puede deshacer.` : ''}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        icon="🗑️"
      />
    </div>
  );
}

export default Budgets;
