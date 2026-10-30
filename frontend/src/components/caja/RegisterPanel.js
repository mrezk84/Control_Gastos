import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createExpense, updateExpense, uploadReceipt, scanReceipt } from '../../services/api';
import { useToast } from '../ui/ToastContainer';
import { suggestCategory } from '../../utils/autoCategory';
import { CATEGORY_ICON, categoryIconClass } from '../../utils/categoryIcons';
import { FOCUS_REGISTER_EVENT } from '../../utils/events';

const CATEGORIES = Object.keys(CATEGORY_ICON);
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '⌫'];
const MAX_RECEIPT_BYTES = 4 * 1024 * 1024; // límite del backend (Vercel acepta hasta 4,5 MB)
const MAX_AMOUNT_CHARS = 9;

const money = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Aplica una tecla al monto (cadena de dígitos, con decimales solo si el gasto editado los tenía). */
export const pressKey = (prev, key) => {
  if (key === '⌫') return prev.slice(0, -1);
  const next = (prev + key).replace(/^0+(?=\d)/, '');
  if (next.length > MAX_AMOUNT_CHARS || /\.\d{3,}/.test(next)) return prev;
  return next;
};

const EMPTY = () => ({ amount: '', description: '', category: '', date: todayLocal() });

/** Panel "Registrar gasto": visor, teclado numérico, categoría, fecha y recibo. Crea o edita. */
function RegisterPanel({ editing, onSaved, onCancelEdit }) {
  const [form, setForm] = useState(EMPTY);
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const descRef = useRef(null);
  const attachRef = useRef(null);
  const scanRef = useRef(null);
  const { success, error, warning, info } = useToast();

  // Entrar o salir del modo edición
  useEffect(() => {
    if (editing) {
      setForm({
        amount: String(editing.amount),
        description: editing.description || '',
        category: editing.category || '',
        date: String(editing.date).slice(0, 10),
      });
      setCategoryTouched(true);
      setReceipt(null);
    } else {
      setForm(EMPTY());
      setCategoryTouched(false);
      setReceipt(null);
    }
  }, [editing]);

  const press = useCallback((key) => setForm((f) => ({ ...f, amount: pressKey(f.amount, key) })), []);

  // Teclado físico: dígitos y Backspace mientras el foco no esté en un campo
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(t.tagName) || t.isContentEditable) return;
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('⌫');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [press]);

  // Cmd/Ctrl+N desde el marco: enfocar la descripción
  useEffect(() => {
    const focus = () => {
      descRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      descRef.current?.focus();
    };
    window.addEventListener(FOCUS_REGISTER_EVENT, focus);
    return () => window.removeEventListener(FOCUS_REGISTER_EVENT, focus);
  }, []);

  const setDescription = (value) =>
    setForm((f) => {
      const next = { ...f, description: value };
      if (!categoryTouched) {
        const suggested = suggestCategory(value);
        if (suggested) next.category = suggested;
      }
      return next;
    });

  const pickCategory = (name) => {
    setCategoryTouched(true);
    setForm((f) => ({ ...f, category: name }));
  };

  const pickReceipt = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_RECEIPT_BYTES) {
      warning('El recibo supera los 4 MB');
      return;
    }
    setReceipt(file);
  };

  const handleScan = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_RECEIPT_BYTES) {
      warning('El archivo supera los 4 MB');
      return;
    }
    setScanning(true);
    try {
      const res = await scanReceipt(file);
      const data = res.data?.data || {};
      setForm((f) => {
        const next = { ...f };
        if (data.amount) next.amount = String(Math.round(data.amount));
        if (data.description) next.description = data.description;
        if (data.date && /^\d{4}-\d{2}-\d{2}$/.test(data.date)) next.date = data.date;
        if (!categoryTouched) {
          const suggested = suggestCategory(`${data.description || ''} ${data.merchant || ''}`);
          if (suggested) next.category = suggested;
        }
        return next;
      });
      setReceipt(file);
      info('Recibo leído: revisá los datos antes de registrar');
    } catch (err) {
      error(err?.response?.data?.detail || 'No se pudo leer el recibo');
    } finally {
      setScanning(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!form.description.trim()) return warning('Ingresá una descripción');
    if (!form.amount || Number.isNaN(amount) || amount <= 0) return warning('El monto debe ser mayor a 0');
    if (!form.category) return warning('Seleccioná una categoría');

    const payload = { description: form.description.trim(), amount, category: form.category, date: form.date };
    setSaving(true);
    try {
      const res = editing ? await updateExpense(editing.id, payload) : await createExpense(payload);
      if (receipt) {
        try {
          await uploadReceipt(res.data.id, receipt);
        } catch {
          warning('El gasto se guardó, pero no se pudo subir el recibo');
        }
      }
      success(editing ? 'Gasto actualizado' : 'Gasto registrado');
      if (editing) onCancelEdit();
      else {
        setForm(EMPTY());
        setCategoryTouched(false);
        setReceipt(null);
      }
      onSaved();
    } catch {
      error(editing ? 'Error al actualizar el gasto' : 'Error al registrar el gasto');
    } finally {
      setSaving(false);
    }
  };

  const catLabel = (form.category || 'Sin categoría').toUpperCase();

  return (
    <form className="cj-reg" onSubmit={handleSubmit} aria-label={editing ? 'Editar gasto' : 'Registrar gasto'}>
      <div className="cj-reg-head">
        <span className="cj-reg-title">
          <i className={`ph ph-${editing ? 'pencil-simple' : 'plus-circle'}`} aria-hidden="true" />
          {editing ? 'Editar gasto' : 'Registrar gasto'}
        </span>
        <button type="button" className="cj-btn" onClick={() => scanRef.current?.click()} disabled={scanning}>
          <i className="ph ph-scan" aria-hidden="true" />{scanning ? 'Leyendo…' : 'Escanear'}
        </button>
        <input ref={scanRef} type="file" accept="image/*,application/pdf" onChange={handleScan} hidden />
      </div>

      <div className="cj-display" role="group" aria-label="Monto">
        <div className="cj-display-top">
          <span>MONTO</span>
          <span><i className={categoryIconClass(form.category || 'Otros')} aria-hidden="true" /> {catLabel}</span>
        </div>
        <div className="cj-display-amt" aria-live="polite">{money.format(Number(form.amount || 0))}</div>
      </div>

      <div className="cj-keys">
        {KEYS.map((k) => (
          <button key={k} type="button" className="cj-key" onClick={() => press(k)} aria-label={k === '⌫' ? 'Borrar' : k}>
            {k === '⌫' ? <i className="ph ph-backspace" aria-hidden="true" /> : k}
          </button>
        ))}
      </div>

      <input
        ref={descRef}
        className="cj-field"
        placeholder="¿En qué gastaste?"
        aria-label="Descripción"
        value={form.description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={255}
      />

      <div className="cj-cats" role="group" aria-label="Categoría">
        {CATEGORIES.map((name) => (
          <button
            key={name}
            type="button"
            className="cj-cat"
            title={name}
            aria-label={name}
            aria-pressed={form.category === name}
            onClick={() => pickCategory(name)}
          >
            <i className={categoryIconClass(name)} aria-hidden="true" />
          </button>
        ))}
      </div>

      <div className="cj-two">
        <input
          type="date"
          className="cj-field"
          aria-label="Fecha"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          required
        />
        <button type="button" className="cj-attach" onClick={() => attachRef.current?.click()}>
          <i className="ph ph-paperclip" aria-hidden="true" />
          <span>{receipt ? receipt.name : 'Recibo'}</span>
        </button>
        <input ref={attachRef} type="file" accept="image/*,application/pdf" onChange={pickReceipt} hidden />
      </div>

      <button type="submit" className="cj-submit" disabled={saving}>
        {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Registrar gasto'}
      </button>
      {editing && (
        <button type="button" className="cj-cancel" onClick={onCancelEdit}>Cancelar edición</button>
      )}
    </form>
  );
}

export default RegisterPanel;
