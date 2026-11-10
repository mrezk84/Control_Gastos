import React, { useState } from 'react';
import Icon from '../ui/Icon';
import { GOALS } from '../../utils/hormiga';

const POINTS = [
  { icon: 'sparkle', title: 'Detecto tus gastos hormiga', text: 'Con los gastos que ya cargas.' },
  { icon: 'target', title: 'Te propongo retos fáciles', text: 'Un paso por vez, a tu ritmo.' },
  { icon: 'book-open', title: 'Te explico con tus números', text: 'Lecciones de 3 minutos, sin jerga.' },
];

/** Primera vez en Gastos hormiga: qué hace el asistente y qué quiere lograr la persona. */
function Welcome({ initialGoals, onStart }) {
  const [goals, setGoals] = useState(initialGoals);
  const toggle = (id) => setGoals((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));

  return (
    <section className="cj-hz-welcome" aria-label="Bienvenida a gastos hormiga">
      <div className="cj-hz-welcome-top">
        <h1>Tu plata chica,<br />a la vista.</h1>
        <p>Te muestro a dónde se va la plata chica de todos los días y te ayudo a recuperarla, sin culpas.</p>
      </div>
      <ul className="cj-hz-points">
        {POINTS.map((p) => (
          <li key={p.title}>
            <span className="cj-hz-point-ico"><Icon name={p.icon} duotone /></span>
            <span><b>{p.title}</b><br /><small>{p.text}</small></span>
          </li>
        ))}
      </ul>
      <fieldset className="cj-hz-goals">
        <legend>¿Qué te gustaría lograr? Puedes elegir más de una.</legend>
        <div>
          {GOALS.map((g) => {
            const on = goals.includes(g.id);
            return (
              <button key={g.id} type="button" className={`cj-hz-chip${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => toggle(g.id)}>
                {on && <Icon name="check" />}{g.label}
              </button>
            );
          })}
        </div>
      </fieldset>
      <button type="button" className="cj-hz-cta" onClick={() => onStart(goals)}>
        <span>Empezar</span><Icon name="arrow-right" />
      </button>
      <p className="cj-hz-foot"><Icon name="lock" /> Solo leo tus gastos. Nunca los cambio ni muevo plata.</p>
    </section>
  );
}

export default Welcome;
