import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '../../context/ExpensesContext';
import Icon from '../ui/Icon';
import { getBudgets } from '../../services/api';
import { FOCUS_REGISTER_EVENT } from '../../utils/events';
import { buildSteps, CURRENCIES, hasStoredLimit, hideGuide, progress, wasHidden } from '../../utils/guia';

/**
 * Asistente guía de los datos generales: un paso por vez (moneda, saldo, primer gasto, presupuesto).
 * Solo lee lo que ya hay cargado y lleva a quien corresponda; no cambia nada por su cuenta.
 */
function GuiaInicial() {
  const { user, expenses, saveProfile } = useAppData();
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(wasHidden);
  const [budgetCount, setBudgetCount] = useState(null);
  const [saldoSet, setSaldoSet] = useState(hasStoredLimit);
  const [currency, setCurrency] = useState('');
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState('');

  useEffect(() => {
    let cancelled = false;
    const now = new Date();
    getBudgets({ month: now.getMonth() + 1, year: now.getFullYear() })
      .then((res) => { if (!cancelled) setBudgetCount(res.data.length); })
      .catch(() => { if (!cancelled) setBudgetCount(0); });
    return () => { cancelled = true; };
  }, []);

  // El saldo se fija en otra tarjeta: al volver a enfocar la ventana o tocar fuera, se vuelve a mirar
  useEffect(() => {
    const recheck = () => setSaldoSet(hasStoredLimit());
    window.addEventListener('focusout', recheck);
    window.addEventListener('focus', recheck);
    return () => {
      window.removeEventListener('focusout', recheck);
      window.removeEventListener('focus', recheck);
    };
  }, []);

  if (hidden || budgetCount === null) return null;

  const steps = buildSteps({ user, expenseCount: expenses.length, budgetCount, saldoSet });
  const { done, total, next, complete } = progress(steps);
  if (complete) return null;

  const hide = () => { hideGuide(); setHidden(true); };

  const saveCurrency = async () => {
    const chosen = CURRENCIES.find((c) => c.code === currency);
    if (!chosen) { setProblem('Elige una moneda de la lista.'); return; }
    setSaving(true);
    setProblem('');
    try {
      await saveProfile({ currency: chosen.code, ...(user?.country ? {} : { country: chosen.country }) });
    } catch {
      setProblem('No pude guardarla. Inténtalo de nuevo en un momento.');
    } finally {
      setSaving(false);
    }
  };

  const go = (action) => {
    if (action.kind === 'route') { navigate(action.to); return; }
    if (action.kind === 'register') {
      document.getElementById('registrar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.dispatchEvent(new CustomEvent(FOCUS_REGISTER_EVENT));
      return;
    }
    if (action.kind === 'saldo') {
      const input = document.querySelector('.cj-sema .cj-limit input');
      input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      input?.focus();
    }
  };

  return (
    <section className="cj-guia" aria-label="Asistente: datos generales">
      <div className="cj-guia-head">
        <span className="cj-hz-bot" aria-hidden="true"><Icon name="robot" duotone /></span>
        <div className="cj-guia-title">
          <b>Te ayudo a dejar tus datos listos</b>
          <small>PASO {done + 1} DE {total} · SOLO LEO, NUNCA CAMBIO</small>
        </div>
        <button type="button" className="cj-guia-hide" onClick={hide} aria-label="Ocultar la guía">
          <Icon name="x" />
        </button>
      </div>

      <div className="cj-guia-bubble" aria-live="polite">
        <b>{next.title}</b>
        <p>{next.text}</p>
        {next.action.kind === 'currency' ? (
          <div className="cj-guia-row">
            <label className="cj-sr" htmlFor="guia-moneda">Moneda</label>
            <select id="guia-moneda" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="">Elige tu moneda…</option>
              {CURRENCIES.map((c) => (<option key={c.code} value={c.code}>{c.label}</option>))}
            </select>
            <button type="button" className="cj-guia-go" onClick={saveCurrency} disabled={saving}>
              {saving ? 'Guardando…' : next.action.label}
            </button>
          </div>
        ) : (
          <button type="button" className="cj-guia-go" onClick={() => go(next.action)}>
            {next.action.label}<Icon name="arrow-right" />
          </button>
        )}
        {problem && <p className="cj-guia-problem" role="alert">{problem}</p>}
      </div>

      <ol className="cj-guia-steps">
        {steps.map((s) => (
          <li key={s.id} className={s.done ? 'is-done' : s.id === next.id ? 'is-next' : ''}>
            <Icon name={s.done ? 'check-circle' : 'circle'} duotone={s.done} />{s.title}
          </li>
        ))}
      </ol>
    </section>
  );
}

export default GuiaInicial;
