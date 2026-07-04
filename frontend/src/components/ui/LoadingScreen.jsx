import React from 'react';
import Logo from './Logo';
import './LoadingScreen.css';

/**
 * LoadingScreen - Pantalla de carga profesional con logo
 * Para usar durante la carga inicial de la aplicación
 */
function LoadingScreen({ message = 'Cargando...', progress = null }) {
  return (
    <div className="loading-screen">
      <div className="loading-screen-content">
        {/* Logo animado */}
        <div className="loading-logo-wrapper">
          <Logo width={80} height={80} variant="default" className="loading-logo" />
          <div className="loading-logo-glow"></div>
        </div>

        {/* Mensaje de carga */}
        <p className="loading-message">{message}</p>

        {/* Barra de progreso opcional */}
        {progress !== null && (
          <div className="loading-progress-container">
            <div className="loading-progress-bar" style={{ width: `${progress}%` }}></div>
          </div>
        )}

        {/* Spinner secundario */}
        <div className="loading-spinner">
          <div className="loading-spinner-ring"></div>
          <div className="loading-spinner-ring inner"></div>
        </div>
      </div>
    </div>
  );
}

/**
 * InlineLoading - Indicador de carga compacto para usar dentro de contenido
 */
function InlineLoading({ size = 'medium', text }) {
  const sizeClass = `inline-loading-${size}`;

  return (
    <div className={`inline-loading ${sizeClass}`}>
      <div className="inline-loading-spinner">
        <div className="inline-loading-ring"></div>
        <div className="inline-loading-ring middle"></div>
        <div className="inline-loading-ring inner"></div>
      </div>
      {text && <span className="inline-loading-text">{text}</span>}
    </div>
  );
}

/**
 * ButtonLoading - Indicador de carga para botones
 */
function ButtonLoading({ text = 'Procesando...' }) {
  return (
    <span className="button-loading">
      <span className="button-loading-spinner"></span>
      <span className="button-loading-text">{text}</span>
    </span>
  );
}

/**
 * PageLoading - Estado de carga para páginas completas
 * Reemplaza al spinner básico con algo más elegante
 */
function PageLoading({ message = 'Cargando contenido...' }) {
  return (
    <div className="page-loading">
      <div className="page-loading-content">
        <div className="page-loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <p className="page-loading-message">{message}</p>
      </div>
    </div>
  );
}

export {
  LoadingScreen,
  InlineLoading,
  ButtonLoading,
  PageLoading,
};
