import React from 'react';

/**
 * Select component - Select personalizado con dark theme
 */
function Select({
  label,
  error,
  options = [],
  placeholder = 'Seleccionar',
  className = '',
  containerClassName = '',
  ...props
}) {
  return (
    <div className={`select-container ${containerClassName}`}>
      {label && <label className="select-label">{label}</label>}
      <div className="select-wrapper">
        <select
          className={`select-field ${error ? 'select-field-error' : ''} ${className}`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        <span className="select-arrow">▼</span>
      </div>
      {error && <span className="select-error">{error}</span>}
    </div>
  );
}

export default Select;
