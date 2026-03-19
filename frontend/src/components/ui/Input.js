import React from 'react';

/**
 * Input component - Input estilizado con dark theme
 */
function Input({
  label,
  error,
  icon,
  className = '',
  containerClassName = '',
  ...props
}) {
  return (
    <div className={`input-container ${containerClassName}`}>
      {label && <label className="input-label">{label}</label>}
      <div className="input-wrapper">
        {icon && <span className="input-icon">{icon}</span>}
        <input
          className={`input-field ${error ? 'input-field-error' : ''} ${icon ? 'input-field-with-icon' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <span className="input-error">{error}</span>}
    </div>
  );
}

export default Input;
