import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppData, useMoney } from '../context/ExpensesContext';
import { useToast } from '../components/ui/ToastContainer';
import Icon from '../components/ui/Icon';
import Modal from '../components/ui/Modal';
import Welcome from '../components/hormiga/Welcome';
import Chat from '../components/hormiga/Chat';
import { categoryIconClass } from '../utils/categoryIcons';
import { formatShare } from '../utils/formatters';
import {
  antIcon, antStatus, buildHormiga, CHALLENGE_DAYS, DEFAULT_ANT_LIMIT, DEFAULT_THRESHOLD, LESSONS, loadChallenge,
  loadGoals, previousMonth, recoveredByChallenge, saveChallenge, saveGoals, simulate, simulatorHint, wasWelcomed,
} from '../utils/hormiga';

const LEVELS = [
  { label: 'VAS BIEN', color: 'var(--ok)', icon: 'check-circle' },
  { label: 'CERCA DEL TOPE', color: 'var(--warn)', icon: 'warning' },
  { label: 'TOPE SUPERADO', color: 'var(--bad)', icon: 'x-circle' },
];

/** Campo numérico que guarda al salir (Enter confirma, Escape cancela). */
function MoneyField({ label, value, onCommit, format }) {
  const [draft, setDraft] = useState(null);
  const commit = () => {
    const n = parseInt(String(draft ?? '').replace(/\D/g, ''), 10);
    if (n > 0) onCommit(n);
    setDraft(null);
  };
  return (
    <label className="cj-limit">
      <span>{label}</span>
      <input
        inputMode="numeric"
        value={draft ?? format(value)}
        onFocus={(e) => { setDraft(String(value)); e.target.select(); }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setDraft(null); }}
      />
    </label>
  );
}

function Panel({ data, config, save, limit, goChat }) {
  const { formatPesos } = useMoney();
  const status = antStatus(data.total, limit);
  const level = LEVELS[status.level];
  const text = status.level === 2
    ? `Te propusiste ${formatPesos(limit)} en compras chicas. Vas ${formatPesos(-status.left)} arriba.`
    : `Te propusiste ${formatPesos(limit)} en compras chicas. Te quedan ${formatPesos(status.left)}.`;

  return (
    <>
      <section className="cj-hero cj-hz-hero" aria-label="Gastos hormiga del mes">
        <div className="cj-hero-main">
          <div className="cj-hero-title"><Icon name="sparkle" duotone />Tus gastos hormiga</div>
          <div className="cj-hero-amount">{formatPesos(data.total)}</div>
          <div className="cj-hero-sub">{data.count} compras chicas · {formatShare(data.sharePct)} del mes</div>
        </div>
        <div className="cj-hero-chart">
          <div className="cj-hero-cap">POR SEMANA</div>
          <div className="cj-bars cj-hz-weeks" role="img" aria-label="Gasto hormiga por semana del mes">
            {data.weeks.map((w, i) => (
              <div key={i} className={`cj-bar${w.current ? ' is-today' : ''}`} style={{ '--h': `${w.heightPct}%` }} title={`Semana ${i + 1} · ${formatPesos(w.value)}`} />
            ))}
          </div>
          <div className="cj-hero-axis"><span>SEM 1</span><span>SEM 2</span><span>SEM 3</span><span>SEM 4</span></div>
        </div>
      </section>

      <section className="cj-sema" aria-label="Tope de compras chicas">
        <div className="cj-sema-body" style={{ '--c': level.color }}>
          <div className="cj-sema-state"><Icon name={level.icon} duotone />{level.label}</div>
          <div className="cj-sema-text">{text}</div>
          <div className="cj-meter" style={{ '--w': `${status.widthPct}%` }}><div /></div>
          <div className="cj-sema-scale"><span>{formatShare(status.ratio * 100)}</span><span>AVISO AL 80 %</span></div>
        </div>
        <MoneyField label="Tope del mes" value={limit} onCommit={(n) => save({ limit: n })} format={formatPesos} />
        {config.limit ? null : <p className="cj-hz-hint">Fija el tope para que te avise al llegar al 80 %.</p>}

        <div className="cj-hz-threshold">
          <span className="cj-hz-label">Es hormiga si cuesta menos de</span>
          <div className="cj-seg" role="group" aria-label="Cómo se calcula el umbral">
            <button type="button" aria-pressed={config.mode === 'auto'} onClick={() => save({ threshold: null })}>Automático</button>
            <button type="button" aria-pressed={config.mode === 'manual'} onClick={() => save({ threshold: config.threshold })}>Manual</button>
          </div>
          {config.mode === 'manual' ? (
            <MoneyField label="Monto" value={config.threshold} onCommit={(n) => save({ threshold: n })} format={formatPesos} />
          ) : (
            <p className="cj-hz-hint">
              <b className="cj-mono">{formatPesos(config.threshold)}</b>{' '}
              {config.sample_size >= 15
                ? `según tus últimas ${config.sample_size} compras: se ajusta solo a tu bolsillo.`
                : 'mientras juntas más compras: después se ajusta solo a tu bolsillo.'}
            </p>
          )}
        </div>

        <button type="button" className="cj-hz-switch" aria-pressed={config.notify} onClick={() => save({ notify: !config.notify })}>
          <Icon name={config.notify ? 'bell-ringing' : 'bell-slash'} duotone />
          <span>Avisarme cuando vea un patrón<small>Como máximo 1 por día y 2 por semana.</small></span>
          <span className="cj-hz-switch-dot" aria-hidden="true" />
        </button>
      </section>

      <section className="cj-card" aria-label="Dónde se va">
        <div className="cj-card-head">
          <h2 className="cj-card-title"><Icon name="receipt" duotone />Dónde se te va</h2>
          <span className="cj-card-meta">TOP 3</span>
        </div>
        {data.top.length === 0 ? (
          <div className="cj-empty">Todavía no hay compras chicas este mes. Cuando las registres, aparecen aquí.</div>
        ) : (
          data.top.map((t) => (
            <div className="cj-row" key={t.name}>
              <div className="cj-row-ico">{antIcon(t.name, t.category) ? <Icon name={antIcon(t.name, t.category)} duotone /> : <i className={categoryIconClass(t.category)} aria-hidden="true" />}</div>
              <div className="cj-row-main">
                <span className="cj-row-desc">{t.name}</span>
                <span className="cj-row-cat">{t.count} {t.count === 1 ? 'compra' : 'compras'}</span>
              </div>
              <span className="cj-row-amt">{formatPesos(t.amount)}</span>
              <button type="button" className="cj-hz-skip" onClick={() => save({ excluded: [...config.excluded, t.name] })} aria-label={`${t.name} no es hormiga`} title="No es hormiga">
                <Icon name="eye-slash" />
              </button>
            </div>
          ))
        )}
        {config.excluded.length > 0 && (
          <div className="cj-hz-excluded">
            <span>Excluidas, no las cuento:</span>
            {config.excluded.map((name) => (
              <button key={name} type="button" className="cj-hz-chip" onClick={() => save({ excluded: config.excluded.filter((x) => x !== name) })} aria-label={`Volver a contar ${name}`}>
                {name}<Icon name="x" />
              </button>
            ))}
          </div>
        )}
      </section>

      <button type="button" className="cj-hz-cta" onClick={goChat}>
        <Icon name="chat-circle" duotone />
        <span>Charlar con mi asistente</span>
        <Icon name="caret-right" />
      </button>
    </>
  );
}

function Plan({ data }) {
  const { formatPesos } = useMoney();
  const [lesson, setLesson] = useState(null);
  const [pct, setPct] = useState(40);
  const [days, setDays] = useState(loadChallenge);
  const { monthly, yearly } = simulate(data.total, pct);
  const done = days.filter(Boolean).length;

  const toggle = (i) => {
    const next = days.map((on, j) => (j === i ? !on : on));
    setDays(next);
    saveChallenge(next);
  };

  return (
    <>
      <section className="cj-hz-sim" aria-label="Simulador">
        <div className="cj-card-head">
          <label htmlFor="hz-pct" className="cj-card-title">Si bajo mis compras chicas un</label>
          <span className="cj-hz-pct">{pct} %</span>
        </div>
        <input id="hz-pct" className="cj-hz-range" type="range" min="0" max="100" step="5" value={pct} onChange={(e) => setPct(Number(e.target.value))} />
        <div className="cj-hz-result"><span>AL AÑO</span><b>{formatPesos(yearly)}</b></div>
        <div className="cj-hz-result is-small"><span>AL MES</span><b>{formatPesos(monthly)}</b></div>
        <p className="cj-hz-hint">{simulatorHint(pct, data.total > 0)} Es una simulación, no una promesa.</p>
      </section>

      <section className="cj-card" aria-label="Reto de 7 días">
        <div className="cj-card-head">
          <h2 className="cj-card-title"><Icon name="fire" duotone />Reto: {CHALLENGE_DAYS} días con menos compras chicas</h2>
          <span className="cj-card-meta">{done === 0 ? 'ARRANCÁS CUANDO QUIERAS' : `${done} DE ${CHALLENGE_DAYS} · VAS BIEN`}</span>
        </div>
        <div className="cj-hz-days">
          {days.map((on, i) => (
            <button
              key={i}
              type="button"
              className={`cj-hz-day${on ? ' is-on' : ''}`}
              aria-pressed={on}
              aria-label={`Día ${i + 1}, ${on ? 'cumplido' : 'pendiente'}`}
              onClick={() => toggle(i)}
            >
              {on ? <Icon name="check" /> : i + 1}
            </button>
          ))}
        </div>
        <p className="cj-hz-hint">Toca el día cuando lo cumplas. Yo voy sumando lo que no gastaste:{' '}
          <b className="cj-mono">{formatPesos(recoveredByChallenge(done, data.total, data.elapsedDays))}</b>.</p>
      </section>

      <section className="cj-hz-lessons" aria-label="Lecciones">
        {LESSONS.map((l) => (
          <button key={l.id} type="button" className="cj-hz-lesson" onClick={() => setLesson(l)}>
            <Icon name={l.icon} duotone />
            <b>{l.title}</b>
            <small>{l.minutes} MIN</small>
          </button>
        ))}
      </section>

      <Modal isOpen={Boolean(lesson)} onClose={() => setLesson(null)} title={lesson?.title || ''}>
        {lesson && (
          <div className="cj-hz-lesson-body">
            {lesson.body.map((t) => (<p key={t}>{t}</p>))}
          </div>
        )}
      </Modal>
    </>
  );
}

const VIEWS = [
  { id: 'inicio', label: 'Inicio', icon: 'sparkle' },
  { id: 'asistente', label: 'Asistente', icon: 'chat-circle' },
  { id: 'plan', label: 'Plan', icon: 'target' },
];
const TITLES = {
  inicio: ['Panel hormiga', null],
  asistente: ['Asistente hormiga', 'Pregúntame lo que quieras'],
  plan: ['Plan hormiga · simulador', '¿Cuánto recuperás?'],
};

function Hormiga() {
  const { user, expenses, hormigaConfig, saveHormigaConfig } = useAppData();
  const { formatPesos } = useMoney();
  const { error } = useToast();
  const [view, setView] = useState('inicio');
  const [welcomed, setWelcomed] = useState(wasWelcomed);
  // Mientras llega la configuración del servidor, valores por defecto
  const config = hormigaConfig || { threshold: DEFAULT_THRESHOLD, mode: 'auto', sample_size: 0, limit: null, notify: true, excluded: [] };
  const threshold = config.threshold;
  const limit = config.limit || DEFAULT_ANT_LIMIT;
  const data = useMemo(() => buildHormiga(expenses, threshold, new Date(), config.excluded), [expenses, threshold, config.excluded]);
  const prev = useMemo(() => buildHormiga(expenses, threshold, previousMonth(new Date()), config.excluded), [expenses, threshold, config.excluded]);
  const name = user?.username ? user.username.charAt(0).toUpperCase() + user.username.slice(1) : 'usuario';

  const save = async (patch) => {
    try {
      await saveHormigaConfig(patch);
    } catch {
      error('No se pudo guardar. Inténtalo de nuevo en un momento.');
    }
  };

  if (!welcomed) {
    return (
      <div className="cj-hz">
        <Welcome initialGoals={loadGoals()} onStart={(goals) => { saveGoals(goals); setWelcomed(true); }} />
      </div>
    );
  }

  const [eyebrow, title] = TITLES[view];
  return (
    <div className="cj-hz">
      <div className="cj-hz-head">
        <div>
          <div className="cj-eyebrow">{eyebrow} · {data.monthLabel}</div>
          <h1 className="cj-greeting">{title || `Hola, ${name}`}</h1>
        </div>
        <div className="cj-seg" role="group" aria-label="Vista">
          {VIEWS.map((v) => (
            <button key={v.id} type="button" aria-pressed={view === v.id} onClick={() => setView(v.id)}><Icon name={v.icon} />{v.label}</button>
          ))}
        </div>
      </div>
      {view === 'inicio' && (
        <Panel data={data} config={config} save={save} limit={limit} goChat={() => setView('asistente')} />
      )}
      {view === 'asistente' && (
        <Chat ctx={{ data, prev, threshold, money: formatPesos }} onPlan={() => setView('plan')} />
      )}
      {view === 'plan' && <Plan data={data} />}
      <p className="cj-hz-foot"><Icon name="lock" /> Solo leemos tus gastos. Nunca los cambiamos ni movemos plata. <Link className="cj-link" to="/expenses">Ver gastos</Link></p>
    </div>
  );
}

export default Hormiga;
