import React from 'react';

/** Indicador de carga centrado: ocupa el área disponible (o toda la ventana con `fullscreen`). */
function PageLoader({ label = 'Cargando…', fullscreen = false }) {
  return (
    <div className={`cj-loader${fullscreen ? ' is-fullscreen' : ''}`} role="status" aria-live="polite">
      <span className="cj-loader-ring" aria-hidden="true" />
      <span className="cj-loader-label">{label}</span>
    </div>
  );
}

export default PageLoader;
