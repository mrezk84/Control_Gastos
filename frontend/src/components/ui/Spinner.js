import React from 'react';

/**
 * Spinner component - Spinner de carga
 */
function Spinner({
  size = 'medium', // small, medium, large
  color = 'primary', // primary, white
  className = '',
}) {
  const spinnerClasses = [
    'spinner',
    `spinner-${size}`,
    `spinner-${color}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={spinnerClasses}>
      <svg className="spinner-svg" viewBox="0 0 50 50">
        <circle
          className="spinner-circle"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="5"
        />
      </svg>
    </div>
  );
}

export default Spinner;
