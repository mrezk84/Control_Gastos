import React from 'react';

/** Cinta superior: repite los datos en bucle continuo (se detiene con prefers-reduced-motion). */
function Ticker({ items, seconds = 40 }) {
  // Cada mitad lleva los datos dos veces para cubrir pantallas anchas; el bucle desplaza -50 %.
  const half = (suffix) => (
    <span className="cj-ticker-half" aria-hidden={suffix === 'b' ? 'true' : undefined}>
      {[0, 1].flatMap((rep) =>
        items.map((text, i) => (
          <React.Fragment key={`${suffix}${rep}-${i}`}>
            <span>{text}</span>
            <span className="cj-ticker-sep">●</span>
          </React.Fragment>
        ))
      )}
    </span>
  );

  return (
    <div className="cj-ticker" role="marquee" aria-label={items.join('. ')}>
      <div className="cj-ticker-track" style={{ '--ticker-speed': `${seconds}s` }} aria-hidden="true">
        {half('a')}
        {half('b')}
      </div>
    </div>
  );
}

export default Ticker;
