import React, { useState } from 'react';
import { useToast } from '../ui/ToastContainer';
import { useAppData } from '../../context/ExpensesContext';
import { payReminder, updateReminder } from '../../services/api';
import { categoryIconClass } from '../../utils/categoryIcons';
import { formatPesos } from '../../utils/formatters';
import { daysUntil, dueText, shortDate } from '../../utils/scanFlow';

/** Panel «Pendientes de pago» del Dashboard. Si no hay recordatorios pendientes, no se muestra. */
function PendingPayments() {
  const { reminders, refresh } = useAppData();
  const { success, error } = useToast();
  const [busyId, setBusyId] = useState(null);

  if (!reminders.length) return null;

  const run = async (id, action, okMessage, failMessage) => {
    setBusyId(id);
    try {
      await action();
      success(okMessage);
      refresh();
    } catch {
      error(failMessage);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="cj-card cj-pending" aria-label="Pendientes de pago">
      <div className="cj-card-head">
        <h2 className="cj-card-title"><i className="ph-duotone ph-calendar-check" aria-hidden="true" />Pendientes de pago</h2>
        <span className="cj-card-meta">{reminders.length} {reminders.length === 1 ? 'FACTURA' : 'FACTURAS'}</span>
      </div>
      <ul className="cj-pending-list">
        {reminders.map((r) => {
          const days = daysUntil(r.due_date);
          const tone = days < 0 ? 'is-bad' : days <= 3 ? 'is-warn' : '';
          return (
            <li className="cj-pending-row" key={r.id}>
              <div className="cj-row-ico"><i className={categoryIconClass(r.category || 'Otros')} aria-hidden="true" /></div>
              <div className="cj-row-main">
                <span className="cj-row-desc">{r.description}</span>
                <span className={`cj-pending-due ${tone}`}>{shortDate(r.due_date)} · {dueText(days)}</span>
              </div>
              <span className="cj-row-amt">{formatPesos(r.amount)}</span>
              <div className="cj-pending-actions">
                <button
                  type="button"
                  className="cj-btn cj-btn-key"
                  disabled={busyId === r.id}
                  onClick={() => run(r.id, () => payReminder(r.id), `Pago registrado: ${r.description}`, 'No se pudo registrar el pago')}
                >
                  Pagar
                </button>
                <button
                  type="button"
                  className="cj-btn-secondary"
                  disabled={busyId === r.id}
                  aria-label={`Descartar ${r.description}`}
                  onClick={() => run(r.id, () => updateReminder(r.id, { status: 'dismissed' }), 'Recordatorio descartado', 'No se pudo descartar')}
                >
                  Descartar
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default PendingPayments;
