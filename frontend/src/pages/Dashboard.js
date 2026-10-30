import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import RegisterPanel from '../components/caja/RegisterPanel';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/ToastContainer';
import { useAppData } from '../context/ExpensesContext';
import { deleteExpense } from '../services/api';
import { buildDashboard, formatStamp } from '../utils/dashboardStats';
import { categoryIconClass } from '../utils/categoryIcons';
import { formatCurrency } from '../utils/formatters';

const pct = (n) => `${n.toFixed(1).replace('.', ',')}%`;
const short = (n) => (n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${Math.round(n)}`);

function Kpi({ icon, label, value, text }) {
  return (
    <div className="cj-kpi">
      <div className="cj-kpi-label"><i className={`ph-duotone ph-${icon}`} aria-hidden="true" />{label}</div>
      <span className={`cj-kpi-value${text ? ' is-text' : ''}`}>{value}</span>
    </div>
  );
}

function Dashboard() {
  const { user, expenses, refresh } = useAppData();
  const { success, error } = useToast();
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const data = useMemo(() => buildDashboard(expenses), [expenses]);
  const { month, trend, categories } = data;
  const name = (user?.username || 'usuario');
  const greetingName = name.charAt(0).toUpperCase() + name.slice(1);

  const startEdit = (expense) => {
    setEditing(expense);
    document.getElementById('registrar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const confirmDelete = async () => {
    const target = toDelete;
    setToDelete(null);
    try {
      await deleteExpense(target.id);
      if (editing?.id === target.id) setEditing(null);
      success('Gasto eliminado');
      refresh();
    } catch {
      error('No se pudo eliminar el gasto');
    }
  };

  return (
    <div className="cj-dash">
      <div className="cj-head">
        <div>
          <div className="cj-eyebrow">Panel principal · {month.name} {month.year}</div>
          <h1 className="cj-greeting">Hola, {greetingName}</h1>
        </div>
        <div>
          <div className="cj-eyebrow is-total">Total acumulado</div>
          <div className="cj-total">{formatCurrency(data.total)}</div>
        </div>
      </div>

      <section className="cj-hero" aria-label="Gasto del mes">
        <div className="cj-hero-main">
          <div className="cj-hero-title"><i className="ph-duotone ph-wallet" aria-hidden="true" />Este mes</div>
          <div>
            <div className="cj-hero-amount">{formatCurrency(month.total)}</div>
            <div className="cj-hero-sub">{month.name} {month.year} · {month.daysInMonth} días</div>
          </div>
        </div>
        <div className="cj-hero-chart">
          <div className="cj-hero-cap">GASTO DIARIO</div>
          <div className="cj-bars" role="img" aria-label={`Gasto diario de ${month.name}`}>
            {month.days.map((d, i) => (
              <div key={i} className={`cj-bar${d.today ? ' is-today' : ''}`} style={{ '--h': `${d.heightPct}%` }} />
            ))}
          </div>
          <div className="cj-hero-axis"><span>1 {month.name.slice(0, 3).toUpperCase()}</span><span>15</span><span>HOY</span></div>
        </div>
      </section>

      <div className="cj-kpis">
        <Kpi icon="chart-bar" label="Promedio" value={formatCurrency(Math.round(data.average))} />
        <Kpi icon="trophy" label="Top categoría" value={data.topCategory} text />
        <Kpi icon="receipt" label="Transacciones" value={data.count} />
        <Kpi icon="squares-four" label="Categorías" value={data.categoryCount} />
      </div>

      <div className="cj-charts">
        <section className="cj-card" aria-label="Gasto por categoría">
          <div className="cj-card-head">
            <span className="cj-card-title">Por categoría</span>
            <span className="cj-card-meta">{categories.length ? `escala ${short(categories[0].amount)}` : ''}</span>
          </div>
          {categories.length === 0 ? (
            <div className="cj-empty">Aún no hay gastos registrados.</div>
          ) : (
            <div className="cj-catbars">
              {categories.map((c, i) => (
                <div className="cj-catcol" key={c.name} title={`${c.name}: ${formatCurrency(c.amount)}`}>
                  <span className="cj-catval">{short(c.amount)}</span>
                  <div className="cj-track">
                    <div className="cj-fill" style={{ '--h': `${c.heightPct}%`, '--c': `var(--cat-${i + 1})` }} />
                  </div>
                  <span className="cj-caticon"><i className={categoryIconClass(c.name)} aria-label={c.name} /></span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="cj-card cj-dist" aria-label="Distribución del gasto">
          <span className="cj-card-title">Distribución</span>
          {categories.length === 0 ? (
            <div className="cj-empty">Sin datos todavía.</div>
          ) : (
            <>
              <div className="cj-stack" aria-hidden="true">
                {categories.map((c, i) => (
                  <span key={c.name} style={{ '--w': `${c.share}%`, '--c': `var(--cat-${i + 1})` }} />
                ))}
              </div>
              <div className="cj-legend">
                {categories.map((c, i) => (
                  <div className="cj-legend-row" key={c.name}>
                    <span className="cj-swatch" style={{ '--c': `var(--cat-${i + 1})` }} />
                    <span>{c.name}</span>
                    <span className="cj-dots" />
                    <span className="cj-legend-pct">{pct(c.share)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      <section className="cj-card" aria-label="Tendencia mensual">
        <div className="cj-card-head">
          <span className="cj-card-title">Tendencia</span>
          {trend.deltaPct !== null && (
            <span className="cj-card-meta is-acc">
              {trend.deltaPct >= 0 ? '+' : ''}{Math.round(trend.deltaPct)}% vs {trend.fromLabel}
            </span>
          )}
        </div>
        {trend.months.length === 0 ? (
          <div className="cj-empty">Registra gastos para ver la tendencia.</div>
        ) : (
          <div className="cj-trend">
            <div className="cj-trend-grid" />
            <svg viewBox={`0 0 ${trend.width} 200`} preserveAspectRatio="none" role="img" aria-label="Gasto mensual">
              <polygon points={trend.area} fill="var(--acct)" fillOpacity="0.1" />
              <polyline points={trend.points} fill="none" stroke="var(--acct)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            </svg>
            {trend.months.map((m) => (
              <React.Fragment key={m.label}>
                <div className="cj-trend-val" style={{ left: `${m.leftPct}%`, top: `${m.topPct}%` }}>{short(m.value)}</div>
                <div className="cj-trend-lbl" style={{ left: `${m.leftPct}%` }}>{m.label}</div>
              </React.Fragment>
            ))}
          </div>
        )}
      </section>

      <aside className="cj-side" id="registrar" aria-label="Registrar gasto">
        <RegisterPanel editing={editing} onSaved={refresh} onCancelEdit={() => setEditing(null)} />
        <div className="cj-paper" aria-label="Último registro">
          <div className="cj-paper-row"><span>ÚLTIMO REGISTRO</span><span>{formatStamp(data.latest)}</span></div>
          <div className="cj-paper-rule" />
          {data.latest ? (
            <>
              <div className="cj-paper-line">
                <span><i className={categoryIconClass(data.latest.category)} aria-hidden="true" /> {data.latest.description}</span>
                <span className="cj-dots" />
                <span>{formatCurrency(data.latest.amount)}</span>
              </div>
              <div className="cj-paper-sub">
                {data.latest.category}
                {data.latest.receipt_url && <> · <i className="ph ph-paperclip" aria-hidden="true" /> con recibo</>}
              </div>
            </>
          ) : (
            <div className="cj-paper-sub">Aún no hay registros.</div>
          )}
        </div>
      </aside>

      <section className="cj-card" aria-label="Historial de gastos">
        <div className="cj-card-head" style={{ marginBottom: 10 }}>
          <span className="cj-card-title"><i className="ph ph-clock-counter-clockwise" aria-hidden="true" />Historial</span>
          <span className="cj-pill">{data.count} registros</span>
        </div>
        {data.groups.length === 0 && <div className="cj-empty">Todavía no registraste gastos. Usa el panel para cargar el primero.</div>}
        {data.groups.map((g) => (
          <div key={g.key}>
            <div className="cj-gh"><span>{g.label}</span><span>{formatCurrency(g.total)}</span></div>
            {g.items.map((r) => (
              <div className={`cj-row${editing?.id === r.id ? ' is-editing' : ''}`} key={r.id}>
                <div className="cj-row-ico"><i className={categoryIconClass(r.category)} aria-hidden="true" /></div>
                <div className="cj-row-main">
                  <div className="cj-row-desc">
                    <span>{r.description}</span>
                    {r.receipt_url && <span className="cj-row-rcpt"><i className="ph ph-paperclip" aria-hidden="true" /> Con recibo</span>}
                  </div>
                  <span className="cj-row-sub">{r.category}</span>
                </div>
                <span className="cj-row-cat cj-row-cat-col">{r.category}</span>
                <span className="cj-row-amt">{formatCurrency(r.amount)}</span>
                <div className="cj-row-actions">
                  <button type="button" title="Editar" aria-label={`Editar ${r.description}`} onClick={() => startEdit(r)}>
                    <i className="ph ph-pencil-simple" aria-hidden="true" />
                  </button>
                  <button type="button" title="Eliminar" aria-label={`Eliminar ${r.description}`} onClick={() => setToDelete(r)}>
                    <i className="ph ph-trash" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
        {data.hiddenRows > 0 && (
          <Link className="cj-more" to="/expenses">Ver los {data.hiddenRows} registros anteriores →</Link>
        )}
      </section>

      <ConfirmDialog
        isOpen={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar gasto"
        message={toDelete ? `¿Eliminar "${toDelete.description}" por ${formatCurrency(toDelete.amount)}? Esta acción no se puede deshacer.` : ''}
        confirmText="Eliminar"
        type="danger"
      />
    </div>
  );
}

export default Dashboard;
