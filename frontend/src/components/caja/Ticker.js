import React from 'react';

/**
 * Cinta superior lima. `items` son pares [etiqueta, valor]; el valor se resalta en negrita.
 * Se repite en bucle continuo y se detiene con prefers-reduced-motion.
 */
function Ticker({ items, seconds = 40 }) {
  // Cada mitad repite los datos dos veces para cubrir pantallas anchas; el bucle desplaza -50 %.
  const half = (suffix) => (
    <span className="cj-ticker-half">
      {[0, 1].flatMap((rep) =>
        items.map(([label, value], i) => (
          <span className="cj-ticker-item" key={`${suffix}${rep}-${i}`}>
            <span className="cj-ticker-dot" />
            {label}
            {value && <b>{value}</b>}
          </span>
        ))
      )}
    </span>
  );

  const summary = items.map(([label, value]) => (value ? `${label} ${value}` : label)).join('. ');

  return (
    <div className="cj-ticker" role="marquee" aria-label={summary}>
      <div className="cj-ticker-track" style={{ '--ticker-speed': `${seconds}s` }} aria-hidden="true">
        {half('a')}
        {half('b')}
      </div>
    </div>
  );
}

export default Ticker;
