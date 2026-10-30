import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import RegisterPanel from '../components/caja/RegisterPanel';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/ToastContainer';
import { useAppData } from '../context/ExpensesContext';
import { deleteExpense } from '../services/api';
import { buildDashboard } from '../utils/dashboardStats';
import { categoryIconClass } from '../utils/categoryIcons';
import { formatK, formatPesos, formatShare } from '../utils/formatters';

function Kpi({ icon, label, value, sub, text }) {
  return (
    <div className="cj-kpi">
      <div className="cj-kpi-label"><i className={`ph-duotone ph-${icon}`} aria-hidden="true" />{label}</div>
      <div className={`cj-kpi-value${text ? ' is-text' : ''}`}>{value}</div>
      <div className="cj-kpi-sub">{sub}</div>
    </div>
  );
}

function Dashboard() {
  const { user, expenses, refresh } = useAppData();
  const { success, error } = useToast();
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const data = useMemo(() => buildDashboard(expenses), [expenses]);
  const { month, trend, categories, latest } = data;
  const monthShort = month.name.slice(0, 3).toUpperCase();
  const name = user?.username || 'usuario';
  const greetingName = name.charAt(0).toUpperCase() + name.slice(1);

  const startEdit = (expense) => {
    setEditing(expense);
    // En pantallas de una columna el panel queda debajo de la tendencia: llevar la vista hasta él
    if (window.innerWidth < 1024) {
      document.getElementById('registrar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
      <div className="cj-area-head cj-head">
        <div>
          <div className="cj-eyebrow">PANEL PRINCIPAL · {month.name.toUpperCase()} {month.year}</div>
          <h1 className="cj-greeting">Hola, {greetingName}</h1>
        </div>
        <div className="cj-head-total">
          <div className="cj-eyebrow">TOTAL ACUMULADO</div>
          <div className="cj-total">{formatPesos(data.total)}</div>
        </div>
      </div>

      <section className="cj-area-hero cj-hero" aria-label="Gasto del mes">
        <div className="cj-hero-main">
          <div className="cj-hero-title"><i className="ph-duotone ph-wallet" aria-hidden="true" />Este mes</div>
          <div className="cj-hero-amount">{formatPesos(month.total)}</div>
          <div className="cj-hero-sub">{month.name} {month.year} · {month.elapsedDays} días</div>
        </div>
        <div className="cj-hero-chart">
          <div className="cj-hero-cap">GASTO DIARIO</div>
          <div className="cj-bars" role="img" aria-label={`Gasto diario de ${month.name}`}>
            {month.days.filter((d) => !d.future).map((d, i) => (
              <div
                key={i}
                className={`cj-bar${d.today ? ' is-today' : ''}`}
                style={{ '--h': `${d.heightPct}%` }}
                title={`${i + 1} ${monthShort} · ${formatPesos(d.value)}`}
              />
            ))}
          </div>
          <div className="cj-hero-axis"><span>1 {monthShort}</span><span>15</span><span>HOY</span></div>
        </div>
      </section>

      <div className="cj-area-kpi cj-kpis">
        <Kpi icon="chart-bar" label="Promedio" value={formatPesos(data.average)} sub="por transacción" />
        <Kpi icon="trophy" label="Top categoría" value={data.topCategory} sub={data.count ? formatPesos(data.topAmount) : '—'} text />
        <Kpi icon="receipt" label="Transacciones" value={data.count} sub="registradas" />
        <Kpi icon="squares-four" label="Categorías" value={data.categoryCount} sub="de 10 en uso" />
      </div>

      <div className="cj-area-charts cj-charts">
        <section className="cj-card cj-card-wide" aria-label="Gasto por categoría">
          <div className="cj-card-head">
            <h2 className="cj-card-title">Por categoría</h2>
            <span className="cj-card-meta">{categories.length ? `ESCALA ${formatK(data.categoryScale)}` : ''}</span>
          </div>
          {categories.length === 0 ? (
            <div className="cj-empty">Aún no hay gastos registrados.</div>
          ) : (
            <div className="cj-catbars">
              {categories.map((c, i) => (
                <div className="cj-catcol" key={c.name} title={`${c.name}: ${formatPesos(c.amount)}`}>
                  <div className="cj-catstack">
                    <span className="cj-catval">{formatK(c.amount)}</span>
                    <div className="cj-fill" style={{ '--h': `${c.heightPct}%`, '--c': `var(--cat-${i + 1})` }} />
                  </div>
                  <i className={`${categoryIconClass(c.name)} cj-caticon`} aria-label={c.name} />
                  <span className="cj-catpct">{formatShare(c.share)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="cj-card cj-card-narrow" aria-label="Distribución del gasto">
          <h2 className="cj-card-title">Distribución</h2>
          {categories.length === 0 ? (
            <div className="cj-empty">Sin datos todavía.</div>
          ) : (
            <>
              <div className="cj-stack" aria-hidden="true">
                {categories.map((c, i) => (
                  <span key={c.name} title={c.name} style={{ '--w': `${c.share}%`, '--c': `var(--cat-${i + 1})` }} />
                ))}
                {data.rest && <span title="Resto" style={{ '--w': `${data.rest.share}%`, '--c': 'var(--line)' }} />}
              </div>
              <div className="cj-legend">
                {categories.map((c, i) => (
                  <div className="cj-legend-row" key={c.name}>
                    <span className="cj-swatch" style={{ '--c': `var(--cat-${i + 1})` }} />
                    <i className={categoryIconClass(c.name)} aria-hidden="true" />
                    <span className="cj-legend-name">{c.name}</span>
                    <span className="cj-legend-amt">{formatPesos(c.amount)}</span>
                    <span className="cj-legend-pct">{formatShare(c.share)}</span>
                  </div>
                ))}
                {data.rest && (
                  <div className="cj-legend-row">
                    <span className="cj-swatch" style={{ '--c': 'var(--line)' }} />
                    <i className="ph-duotone ph-package" aria-hidden="true" />
                    <span className="cj-legend-name">Resto</span>
                    <span className="cj-legend-amt">{formatPesos(data.rest.amount)}</span>
                    <span className="cj-legend-pct">{formatShare(data.rest.share)}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      <section className="cj-area-trend cj-card" aria-label="Tendencia mensual">
        <div className="cj-card-head">
          <h2 className="cj-card-title">Tendencia</h2>
          {trend.deltaPct !== null && (
            <span className="cj-delta">
              {trend.deltaPct >= 0 ? '+' : ''}{Math.round(trend.deltaPct)}% vs {trend.fromLabel}
            </span>
          )}
        </div>
        {trend.months.length === 0 ? (
          <div className="cj-empty">Registra gastos para ver la tendencia.</div>
        ) : (
          <>
            <svg className="cj-trend-svg" viewBox="0 0 600 140" preserveAspectRatio="none" role="img" aria-label="Gasto mensual">
              <path d={trend.area} fill="var(--accsoft)" />
              <path d={trend.line} fill="none" stroke="var(--acct)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
            </svg>
            <div className="cj-trend-months">
              {trend.months.map((m, i) => (
                <div key={m.label + i} className={i === trend.months.length - 1 ? 'is-last' : ''}>
                  <span>{m.label}</span>
                  <b>{formatK(m.value)}</b>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <aside className="cj-area-side cj-side" id="registrar" aria-label="Registrar gasto">
        <RegisterPanel editing={editing} onSaved={refresh} onCancelEdit={() => setEditing(null)} />
        {latest && (
          <section className="cj-paper" aria-label="Último registro">
            <div className="cj-paper-row"><span>ÚLTIMO REGISTRO</span><span>N.º {String(latest.id).padStart(4, '0')}</span></div>
            <div className="cj-paper-rule" />
            <div className="cj-paper-line">
              <span>{latest.description}</span>
              <span className="cj-dots" />
              <b>{formatPesos(latest.amount)}</b>
            </div>
            <div className="cj-paper-sub">
              <span>{(latest.category || '').toUpperCase()}</span>
              <span>{data.latestLabel}</span>
            </div>
            <div className="cj-paper-rule" />
            <div className="cj-paper-total"><span>TOTAL MES</span><b>{formatPesos(month.total)}</b></div>
          </section>
        )}
      </aside>

      <section className="cj-area-hist cj-card" aria-label="Historial de gastos">
        <div className="cj-card-head" style={{ marginBottom: 6 }}>
          <h2 className="cj-card-title"><i className="ph ph-clock-counter-clockwise" aria-hidden="true" />Historial</h2>
          <Link className="cj-link" to="/expenses">Ver todos</Link>
        </div>
        {data.groups.length === 0 && (
          <div className="cj-empty">Todavía no registraste gastos. Usa el panel para cargar el primero.</div>
        )}
        {data.groups.map((g) => (
          <div key={g.key}>
            <div className="cj-gh"><span>{g.label}</span><span>{formatPesos(g.total)}</span></div>
            {g.items.map((r) => (
              <div className={`cj-row${editing?.id === r.id ? ' is-editing' : ''}`} key={r.id}>
                <div className="cj-row-ico"><i className={categoryIconClass(r.category)} aria-hidden="true" /></div>
                <div className="cj-row-main">
                  <span className="cj-row-desc">{r.description}</span>
                  <span className="cj-row-cat">{r.category}</span>
                </div>
                <span className="cj-row-amt">{formatPesos(r.amount)}</span>
                <div className="cj-row-actions">
                  <button type="button" aria-label={`Editar ${r.description}`} onClick={() => startEdit(r)}>
                    <i className="ph ph-pencil-simple" aria-hidden="true" />
                  </button>
                  <button type="button" aria-label={`Eliminar ${r.description}`} onClick={() => setToDelete(r)}>
                    <i className="ph ph-trash" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </section>

      <ConfirmDialog
        isOpen={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="¿Eliminar gasto?"
        message={toDelete ? `${toDelete.description} · ${formatPesos(toDelete.amount)}. Esta acción no se puede deshacer.` : ''}
        confirmText="Eliminar"
        type="danger"
      />
    </div>
  );
}

export default Dashboard;
