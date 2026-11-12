import React, { useState, useEffect, useCallback } from 'react';
import { getBudgetsProgress, createBudget, updateBudget, deleteBudget, getAllExpenses, createExpense } from '../services/api';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import PageLoader from '../components/ui/PageLoader';
import Icon from '../components/ui/Icon';
import { categoryIconClass } from '../utils/categoryIcons';
import { CATEGORIES } from '../utils/constants';
import { formatDateForInput, formatShare } from '../utils/formatters';
import { useMoney } from '../context/ExpensesContext';
import logger from '../utils/logger';
import { useToast } from '../components/ui/ToastContainer';
import { EXPENSE_CREATED_EVENT } from '../utils/events';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/** Fecha de hoy en hora local (toISOString usa UTC y de noche devuelve el día siguiente). */
const todayISO = () => formatDateForInput(new Date());

/** Estado de un presupuesto según el porcentaje gastado: color, icono y texto (nunca solo color). */
const budgetStatus = (percentage) => {
  if (percentage >= 100) return { level: 'bad', color: 'var(--bad)', icon: 'warning-octagon', label: 'Excedido' };
  if (percentage >= 80) return { level: 'warn', color: 'var(--warn)', icon: 'warning', label: 'Cerca del límite' };
  return { level: 'ok', color: 'var(--ok)', icon: 'check-circle', label: 'En orden' };
};

function Budgets() {
  const { formatCurrency } = useMoney();
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
    date: todayISO(),
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
      const today = todayISO();
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

  // Refresh when an expense is created elsewhere in the app (FAB / Cmd+N).
  useEffect(() => {
    const handler = () => {
      fetchBudgets();
      fetchTodayExpenses();
    };
    window.addEventListener(EXPENSE_CREATED_EVENT, handler);
    return () => window.removeEventListener(EXPENSE_CREATED_EVENT, handler);
  }, [fetchBudgets, fetchTodayExpenses]);

  const handleSave = async (e) => {
    e.preventDefault();

    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      warning('El monto debe ser mayor a 0');
      return;
    }

    if (!formData.category) {
      warning('Selecciona una categoría');
      return;
    }

    if (!editingBudget) {
      const existingBudget = budgets.find(b => b.category === formData.category);
      if (existingBudget) {
        warning(
          `Ya tienes un presupuesto de "${formData.category}" para ${MONTHS[currentMonth - 1]} ${currentYear}. ` +
          `Monto: ${formatCurrency(existingBudget.budget_amount)} · Gastado: ${formatCurrency(existingBudget.spent_amount)}`
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
      success(editingBudget ? 'Presupuesto actualizado' : 'Presupuesto creado');
    } catch (err) {
      logger.apiError('Error saving budget', err);
      let errorMessage = 'Error al guardar el presupuesto';
      if (err.response?.data?.detail) errorMessage = err.response.data.detail;
      else if (err.message) errorMessage = err.message;
      error(String(errorMessage));
    }
  };

  // Handle quick expense add
  const handleQuickExpense = async (e) => {
    e.preventDefault();

    const amount = parseFloat(expenseData.amount);
    if (!expenseData.amount || isNaN(amount) || amount <= 0) {
      warning('El monto debe ser mayor a 0');
      return;
    }

    if (!expenseData.description.trim()) {
      warning('Ingresa una descripción');
      return;
    }

    if (!expenseData.category) {
      warning('Selecciona una categoría');
      return;
    }

    const payload = {
      description: expenseData.description,
      amount,
      category: expenseData.category,
      date: expenseData.date,
    };

    const today = todayISO();
    const isToday = payload.date === today;
    const tempId = `temp-${Date.now()}`;

    // Optimistic UI: show the expense (and its budget impact) immediately,
    // roll back if the request fails, instead of waiting on the server.
    if (isToday) {
      setTodayExpenses((prev) => [{ id: tempId, ...payload }, ...prev]);
    }
    setBudgets((prev) => prev.map((b) => {
      if (b.category !== payload.category) return b;
      const spent_amount = b.spent_amount + amount;
      const remaining_amount = b.budget_amount - spent_amount;
      const percentage = b.budget_amount > 0 ? (spent_amount / b.budget_amount) * 100 : 0;
      return { ...b, spent_amount, remaining_amount, percentage };
    }));

    closeQuickExpenseModal();
    success('Gasto agregado correctamente');

    try {
      await createExpense(payload);
      // Reconcile with the server in the background (real id, exact totals).
      fetchTodayExpenses();
      fetchBudgets();
    } catch (err) {
      logger.apiError('Error adding expense', err);
      if (isToday) {
        setTodayExpenses((prev) => prev.filter((e) => e.id !== tempId));
      }
      await fetchBudgets();
      error('No se pudo agregar el gasto, se deshizo el cambio');
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
    setBudgetToDelete(budget);
    setShowConfirmDialog(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!budgetToDelete) return;

    try {
      await deleteBudget(budgetToDelete.budget_id);
      await fetchBudgets();
      success('Presupuesto eliminado');
    } catch (err) {
      logger.apiError('Error deleting budget', err);
      error('Error al eliminar el presupuesto');
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
      date: todayISO(),
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
    setExpenseData({ description: '', amount: '', category: '', date: todayISO() });
  };


  // Calculate totals
  const totalBudget = budgets.reduce((sum, b) => sum + b.budget_amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent_amount, 0);
  const totalRemaining = totalBudget - totalSpent;
  const totalPercentage = totalBudget > 0 ? (totalSpent / totalBudget * 100) : 0;
  const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  const overall = budgetStatus(totalPercentage);
  const monthLabel = `${MONTHS[currentMonth - 1]} ${currentYear}`;
  const todayLabel = new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });

  if (loading) {
    return <PageLoader label="Cargando presupuestos…" />;
  }

  return (
    <div className="cj-page">
      <header className="cj-head">
        <div>
          <span className="cj-eyebrow">Plan del mes · {monthLabel}</span>
          <h1 className="cj-greeting">Presupuestos</h1>
        </div>
        <div className="cj-head-actions">
          <button type="button" className="cj-act" onClick={() => openQuickExpenseModal()}>
            <Icon name="plus" /> Gasto rápido
          </button>
          <button type="button" className="cj-act is-primary" onClick={openNewModal}>
            <Icon name="target" /> Nuevo presupuesto
          </button>
        </div>
      </header>

      {budgets.length > 0 && (
        <section className="cj-hero cj-bud-hero" aria-label="Resumen de presupuestos">
          <div className="cj-hero-main">
            <div className="cj-hero-title"><Icon name="target" duotone />Gastado del presupuesto</div>
            <div className="cj-hero-amount">{formatCurrency(totalSpent)}</div>
            <div className="cj-hero-sub">
              de {formatCurrency(totalBudget)} · {budgets.length} {budgets.length === 1 ? 'categoría' : 'categorías'}
            </div>
          </div>
          <div className="cj-bud-hero-side" style={{ '--c': overall.color }}>
            <div className="cj-sema-state"><Icon name={overall.icon} />{overall.label.toUpperCase()}</div>
            <div className="cj-meter" style={{ '--w': `${Math.min(totalPercentage, 100)}%` }}><div /></div>
            <div className="cj-sema-scale">
              <span>{formatShare(totalPercentage)}</span>
              <span>
                {totalRemaining < 0
                  ? `Excedido por ${formatCurrency(Math.abs(totalRemaining))}`
                  : `Disponible ${formatCurrency(totalRemaining)}`}
              </span>
            </div>
          </div>
        </section>
      )}

      {budgets.length === 0 ? (
        <section className="cj-card">
          <EmptyState
            icon={<Icon name="piggy-bank" duotone />}
            title="Sin presupuestos este mes"
            description="Fija un tope por categoría y mira cuánto te queda a medida que registras gastos."
            action={
              <button type="button" className="cj-act is-primary" onClick={openNewModal}>
                <Icon name="target" /> Crear presupuesto
              </button>
            }
          />
        </section>
      ) : (
        <div className="cj-budgets">
          {budgets.map((budget) => {
            const status = budgetStatus(budget.percentage);
            return (
              <article key={budget.budget_id} className="cj-card cj-budget" style={{ '--c': status.color }}>
                <div className="cj-budget-head">
                  <div className="cj-row-ico"><i className={categoryIconClass(budget.category)} aria-hidden="true" /></div>
                  <h2 className="cj-budget-name">{budget.category}</h2>
                  <span className="cj-status" title={status.label}>
                    <Icon name={status.icon} />
                    <span className="cj-sr">{status.label}: </span>
                    {formatShare(budget.percentage)}
                  </span>
                </div>
                <div className="cj-budget-amt">
                  <b>{formatCurrency(budget.spent_amount)}</b>
                  <span>de {formatCurrency(budget.budget_amount)}</span>
                </div>
                <div className="cj-meter" style={{ '--w': `${Math.min(budget.percentage, 100)}%` }}><div /></div>
                <div className="cj-budget-foot">
                  <span className={budget.remaining_amount < 0 ? 'is-over' : ''}>
                    {budget.remaining_amount < 0
                      ? `Excedido por ${formatCurrency(Math.abs(budget.remaining_amount))}`
                      : `Quedan ${formatCurrency(budget.remaining_amount)}`}
                  </span>
                  <div className="cj-row-actions">
                    <button type="button" onClick={() => openQuickExpenseModal(budget.category)} title="Agregar gasto" aria-label={`Agregar gasto en ${budget.category}`}>
                      <Icon name="plus" />
                    </button>
                    <button type="button" onClick={() => handleEdit(budget)} title="Editar" aria-label={`Editar presupuesto de ${budget.category}`}>
                      <Icon name="pencil-simple" />
                    </button>
                    <button type="button" onClick={() => handleDeleteClick(budget)} title="Eliminar" aria-label={`Eliminar presupuesto de ${budget.category}`}>
                      <Icon name="trash" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <section className="cj-card" aria-label="Compras de hoy">
        <div className="cj-card-head">
          <h2 className="cj-card-title"><Icon name="calendar-dots" />Compras de hoy</h2>
          <div className="cj-table-sum">
            <span>{todayLabel}</span>
            <b>{formatCurrency(todayTotal)}</b>
          </div>
        </div>
        {todayExpenses.length === 0 ? (
          <div className="cj-empty">
            Hoy no registraste compras.{' '}
            <button type="button" className="cj-link-btn" onClick={() => openQuickExpenseModal()}>Agregar un gasto</button>
          </div>
        ) : (
          <div>
            {todayExpenses.map((expense) => {
              const budget = budgets.find((b) => b.category === expense.category);
              const remaining = budget ? budget.remaining_amount : null;
              return (
                <div key={expense.id} className="cj-row">
                  <div className="cj-row-ico"><i className={categoryIconClass(expense.category)} aria-hidden="true" /></div>
                  <div className="cj-row-main">
                    <span className="cj-row-desc">{expense.description}</span>
                    <span className="cj-row-cat">
                      {expense.category}
                      {remaining !== null && (
                        <span className={remaining < 0 ? 'cj-note is-over' : 'cj-note'}>
                          {' · '}
                          {remaining < 0 ? `excedido por ${formatCurrency(Math.abs(remaining))}` : `quedan ${formatCurrency(remaining)}`}
                        </span>
                      )}
                    </span>
                  </div>
                  <span className="cj-row-amt">{formatCurrency(expense.amount)}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Create/Edit Budget Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingBudget ? 'Editar presupuesto' : 'Nuevo presupuesto'}
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
              <option value="">Seleccionar…</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Monto mensual</label>
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
              {editingBudget ? 'Guardar cambios' : 'Crear presupuesto'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Quick Expense Modal */}
      <Modal
        isOpen={showQuickExpenseModal}
        onClose={closeQuickExpenseModal}
        title="Gasto rápido"
      >
        <form onSubmit={handleQuickExpense}>
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <input
              type="text"
              className="form-input"
              value={expenseData.description}
              onChange={(e) => setExpenseData({ ...expenseData, description: e.target.value })}
              placeholder="Café, supermercado…"
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
              <option value="">Seleccionar…</option>
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
              Agregar gasto
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleDeleteConfirmed}
        title="¿Eliminar presupuesto?"
        message={budgetToDelete ? `Presupuesto de ${budgetToDelete.category}. Tus gastos no se borran. Esta acción no se puede deshacer.` : ''}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        icon={<Icon name="trash" duotone />}
      />
    </div>
  );
}

export default Budgets;
