import React, { useState } from 'react';
import Modal from './ui/Modal';
import { useToast } from './ui/ToastContainer';
import { createExpense } from '../services/api';
import { suggestCategory } from '../utils/autoCategory';

const CATEGORIES = [
  'Alimentación', 'Transporte', 'Entretenimiento', 'Salud', 'Servicios',
  'Educación', 'Vivienda', 'Ropa', 'Tecnología', 'Otros',
];

const EMPTY_FORM = {
  description: '',
  amount: '',
  category: '',
  date: new Date().toISOString().split('T')[0],
};

/**
 * Global "quick add expense" modal, opened from the FAB or Cmd/Ctrl+N.
 * Suggests a category as the user types a description (heuristic, not ML)
 * until they pick one manually.
 */
function QuickAddExpense({ isOpen, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const { success, error, warning } = useToast();

  const handleDescriptionChange = (value) => {
    setForm((prev) => {
      const next = { ...prev, description: value };
      if (!categoryTouched) {
        const suggested = suggestCategory(value);
        if (suggested) next.category = suggested;
      }
      return next;
    });
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setCategoryTouched(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);

    if (!form.description.trim()) {
      warning('⚠️ Ingresá una descripción');
      return;
    }
    if (!form.amount || isNaN(amount) || amount <= 0) {
      warning('⚠️ El monto debe ser mayor a 0');
      return;
    }
    if (!form.category) {
      warning('⚠️ Seleccioná una categoría');
      return;
    }

    setSaving(true);
    try {
      const res = await createExpense({
        description: form.description.trim(),
        amount,
        category: form.category,
        date: form.date,
      });
      success('💸 Gasto agregado correctamente');
      onCreated?.(res.data);
      handleClose();
    } catch (err) {
      error('❌ Error al agregar el gasto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="💸 Gasto Rápido">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="qa-description">Descripción</label>
          <input
            id="qa-description"
            className="form-input"
            type="text"
            placeholder="Ej: Café, Supermercado..."
            value={form.description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            autoFocus
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="qa-amount">Monto</label>
          <input
            id="qa-amount"
            className="form-input"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="qa-category">
            Categoría
            {form.category && !categoryTouched && (
              <span className="form-label-hint"> · sugerida automáticamente</span>
            )}
          </label>
          <select
            id="qa-category"
            className="form-select"
            value={form.category}
            onChange={(e) => {
              setCategoryTouched(true);
              setForm({ ...form, category: e.target.value });
            }}
            required
          >
            <option value="">Seleccionar...</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="qa-date">Fecha</label>
          <input
            id="qa-date"
            className="form-input"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={handleClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Guardando...' : 'Agregar Gasto'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default QuickAddExpense;
