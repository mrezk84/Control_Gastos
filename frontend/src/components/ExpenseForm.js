import React, { useState, useEffect } from 'react';
import { createExpense, updateExpense, uploadReceipt } from '../services/api';
import ReceiptScanner from './ReceiptScanner';

const CATEGORIES = [
  { name: 'Alimentación', icon: '🍔' },
  { name: 'Transporte', icon: '🚗' },
  { name: 'Entretenimiento', icon: '🎬' },
  { name: 'Salud', icon: '💊' },
  { name: 'Servicios', icon: '💡' },
  { name: 'Educación', icon: '📚' },
  { name: 'Vivienda', icon: '🏠' },
  { name: 'Ropa', icon: '👕' },
  { name: 'Tecnología', icon: '📱' },
  { name: 'Otros', icon: '📦' },
];

function ExpenseForm({ setExpenses, editingExpense, setEditingExpense }) {
  const [expense, setExpense] = useState({
    description: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);

  useEffect(() => {
    if (editingExpense) {
      setExpense({
        description: editingExpense.description || '',
        amount: editingExpense.amount || '',
        category: editingExpense.category || '',
        date: editingExpense.date?.split('T')[0] || new Date().toISOString().split('T')[0]
      });
    }
  }, [editingExpense]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!expense.description || !expense.amount || !expense.category || !expense.date) return;

    setLoading(true);
    try {
      const expenseData = {
        ...expense,
        amount: parseFloat(expense.amount)
      };

      let response;
      if (editingExpense) {
        response = await updateExpense(editingExpense.id, expenseData);
        setExpenses((prev) =>
          prev.map((exp) => (exp.id === editingExpense.id ? response.data : exp))
        );
      } else {
        response = await createExpense(expenseData);
        setExpenses((prev) => [...prev, response.data]);

        // Subir recibo si existe
        if (receiptFile && response.data?.id) {
          await uploadReceipt(response.data.id, receiptFile);
        }
      }

      resetForm();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error('Error al guardar gasto');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setExpense({
      description: '',
      amount: '',
      category: '',
      date: new Date().toISOString().split('T')[0]
    });
    setReceiptFile(null);
    setReceiptPreview(null);
    setEditingExpense(null);
  };

  const handleScanComplete = (data) => {
    setExpense((prev) => ({
      ...prev,
      description: data.description || prev.description,
      amount: data.amount || prev.amount,
      date: data.date || prev.date
    }));
    setShowScanner(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setReceiptPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <div className="expense-form-card modern-glass">
        <div className="expense-form-header">
          <div className="expense-form-title">
            {editingExpense ? '✏️ Editar Gasto' : '➕ Agregar Gasto'}
            {success && (
              <span className="success-badge">✓ Guardado</span>
            )}
          </div>
          <button
            className="btn-scan"
            onClick={() => setShowScanner(true)}
            title="Escanear recibo"
          >
            <span className="scan-icon">📷</span>
            <span>Escanear</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="expense-form-grid">
            <div className="form-group-modern">
              <label htmlFor="exp-description">Descripción</label>
              <input
                id="exp-description"
                className="input-modern"
                type="text"
                placeholder="¿En qué gastaste?"
                value={expense.description}
                onChange={(e) => setExpense({ ...expense, description: e.target.value })}
              />
            </div>

            <div className="form-group-modern">
              <label htmlFor="exp-amount">Monto</label>
              <div className="input-with-icon">
                <span className="input-icon">$</span>
                <input
                  id="exp-amount"
                  className="input-modern"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={expense.amount}
                  onChange={(e) => setExpense({ ...expense, amount: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group-modern">
              <label htmlFor="exp-category">Categoría</label>
              <select
                id="exp-category"
                className="select-modern"
                value={expense.category}
                onChange={(e) => setExpense({ ...expense, category: e.target.value })}
              >
                <option value="">Seleccioná</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group-modern">
              <label htmlFor="exp-date">Fecha</label>
              <input
                id="exp-date"
                className="input-modern"
                type="date"
                value={expense.date}
                onChange={(e) => setExpense({ ...expense, date: e.target.value })}
              />
            </div>

            <div className="form-group-modern full-width">
              <label>Recibo (opcional)</label>
              <div className="receipt-upload">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id="receipt-input"
                />
                <label htmlFor="receipt-input" className="btn-receipt-upload">
                  📎 Adjuntar Recibo
                </label>
                {receiptPreview && (
                  <div className="receipt-preview-mini">
                    <img src={receiptPreview} alt="Preview" />
                    <button
                      type="button"
                      className="btn-remove-receipt"
                      onClick={() => {
                        setReceiptFile(null);
                        setReceiptPreview(null);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="form-actions">
              {editingExpense && (
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={resetForm}
                >
                  Cancelar
                </button>
              )}
              <button className="btn-add-expense" type="submit" disabled={loading}>
                {loading ? 'Guardando...' : editingExpense ? '💾 Guardar Cambios' : '➕ Agregar'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {showScanner && (
        <ReceiptScanner
          onScanComplete={handleScanComplete}
          onCancel={() => setShowScanner(false)}
        />
      )}
    </>
  );
}

export default ExpenseForm;