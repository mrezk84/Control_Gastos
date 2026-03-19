import React from 'react';

/**
 * Button component - Botones con múltiples variantes
 */
function Button({
  children,
  variant = 'primary', // primary, secondary, success, danger, ghost
  size = 'medium', // small, medium, large
  loading = false,
  disabled = false,
  className = '',
  onClick,
  ...props
}) {
  const buttonClasses = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    loading && 'btn-loading',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <span className="btn-spinner" />}
      <span className="btn-content">{children}</span>
    </button>
  );
}

export default Button;
