import React from 'react';

/** Icono Phosphor decorativo (los botones de solo icono llevan su propio aria-label). */
function Icon({ name, duotone = false, className = '' }) {
  return <i className={`ph${duotone ? '-duotone' : ''} ph-${name} ${className}`.trim()} aria-hidden="true" />;
}

export default Icon;
