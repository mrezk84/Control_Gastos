import React, { useState } from 'react';
import { formatPesos, formatShare } from '../../utils/formatters';
import { loadLimit, parseLimit, saldoStatus, saveLimit, WARN_PCT } from '../../utils/saldo';

const LEVELS = [
  { label: 'DENTRO DEL SALDO', color: 'var(--ok)', icon: 'ph-duotone ph-check-circle' },
  { label: 'CERCA DEL LÍMITE', color: 'var(--warn)', icon: 'ph-duotone ph-warning' },
  { label: 'SALDO SUPERADO', color: 'var(--bad)', icon: 'ph-duotone ph-x-circle' },
];

/** Semáforo del saldo del mes: compara el gasto del mes con el saldo que fija la persona. */
function SaldoCard({ monthTotal }) {
  const [limit, setLimit] = useState(loadLimit);
  const [draft, setDraft] = useState(null);
  const status = saldoStatus(monthTotal, limit);
  const level = LEVELS[status.level];

  const text = status.level === 2
    ? `Superaste el saldo por ${formatPesos(-status.left)}. Gastado ${formatPesos(monthTotal)} de ${formatPesos(limit)}.`
    : `Gastado ${formatPesos(monthTotal)} de ${formatPesos(limit)}. Te quedan ${formatPesos(status.left)}.`;

  const commit = () => {
    const n = parseLimit(draft ?? '');
    if (n) {
      setLimit(n);
      saveLimit(n);
    }
    setDraft(null);
  };

  return (
    <section className="cj-area-sema cj-sema" aria-label="Saldo del mes">
      <div className="cj-lamps" role="img" aria-label={level.label}>
        {LEVELS.map((l, i) => (
          <span key={l.label} className={i === status.level ? 'is-on' : ''} style={{ '--c': l.color }} />
        ))}
      </div>
      <div className="cj-sema-body" style={{ '--c': level.color }}>
        <div className="cj-sema-state"><i className={level.icon} aria-hidden="true" />{level.label}</div>
        <div className="cj-sema-text">{text}</div>
        <div className="cj-meter" style={{ '--w': `${status.widthPct}%` }}><div /></div>
        <div className="cj-sema-scale">
          <span>{formatShare(status.ratio * 100)}</span>
          <span>AVISO AL {WARN_PCT} %</span>
        </div>
      </div>
      <label className="cj-limit">
        <span>Saldo del mes</span>
        <input
          inputMode="numeric"
          value={draft ?? formatPesos(limit)}
          onFocus={(e) => { setDraft(String(limit)); e.target.select(); }}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setDraft(null); }}
          aria-label="Saldo del mes"
        />
      </label>
    </section>
  );
}

export default SaldoCard;
