import React from 'react';
import { useLocation } from 'react-router-dom';

/**
 * PageTransition - Wrapper para transiciones animadas entre páginas.
 * Re-triggers a fade-in on every route change by keying on the pathname
 * (React Router already swaps `children` to the new route's content before
 * any effect runs, so there's no stable "old" tree to cross-fade against —
 * keeping this to a keyed fade-in avoids animating the wrong content).
 */
function PageTransition({ children }) {
  const location = useLocation();

  return (
    <div key={location.pathname} className="page-transition page-transition-fade-in">
      {children}
    </div>
  );
}

/**
 * AnimatedPage - Wrapper para páginas individuales con animación de entrada
 */
function AnimatedPage({ children, animation = 'fadeInUp' }) {
  const nodeRef = useRef(null);

  const animations = {
    fadeInUp: 'animated-page-fade-in-up',
    fadeIn: 'animated-page-fade-in',
    slideIn: 'animated-page-slide-in',
    scaleIn: 'animated-page-scale-in',
  };

  return (
    <div ref={nodeRef} className={`animated-page ${animations[animation] || animations.fadeInUp}`}>
      {children}
    </div>
  );
}

/**
 * PageLoader - Loader durante transiciones de página
 */
function PageLoader({ loading = false }) {
  if (!loading) return null;

  return (
    <div className="page-loader-overlay">
      <div className="page-loader-content">
        <div className="page-loader-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring middle"></div>
          <div className="spinner-ring inner"></div>
        </div>
        <p className="page-loader-text">Cargando...</p>
      </div>
    </div>
  );
}

export { PageTransition, AnimatedPage, PageLoader };
