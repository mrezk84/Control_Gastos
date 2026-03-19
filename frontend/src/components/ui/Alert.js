import React from 'react';

/**
 * Componente de Alerta elegante
 * @param {Object} props
 * @param {string} props.type - Tipo de alerta: 'success', 'error', 'warning', 'info'
 * @param {React.ReactNode} props.children - Contenido de la alerta
 * @param {string} props.className - Clases adicionales
 * @param {Function} props.onClose - Función para cerrar la alerta
 * @param {boolean} props.closable - Si es cerrable (default: true)
 * @param {string} props.title - Título opcional para la alerta (mejora accesibilidad)
 */
function Alert({ type = 'info', children, className = '', onClose, closable = true, title }) {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  const ariaRole = type === 'error' || type === 'warning' ? 'alert' : 'status';
  const ariaLabels = {
    success: 'Éxito',
    error: 'Error',
    warning: 'Advertencia',
    info: 'Información'
  };

  const handleClose = () => {
    if (onClose) onClose();
  };

  return (
    <div
      className={`alert alert-${type} ${className}`}
      role={ariaRole}
      aria-live={type === 'error' || type === 'warning' ? 'assertive' : 'polite'}
      aria-atomic="true"
      aria-label={title || ariaLabels[type]}
    >
      <span className="alert-icon" aria-hidden="true">{icons[type] || icons.info}</span>
      <div className="alert-content">
        {title && <span className="sr-only">{title}: </span>}
        {children}
      </div>
      {closable && (
        <button
          className="alert-close"
          onClick={handleClose}
          aria-label="Cerrar alerta"
          type="button"
        >
          <span aria-hidden="true">✕</span>
        </button>
      )}
    </div>
  );
}

/**
 * Componente de Toast/Notificación
 * @param {Object} props
 * @param {string} props.type - Tipo: 'success', 'error', 'warning', 'info'
 * @param {string} props.message - Mensaje a mostrar
 * @param {number} props.duration - Duración en ms (0 para no cerrar auto)
 * @param {Function} props.onClose - Función al cerrar
 */
function Toast({ type = 'info', message, duration = 4000, onClose }) {
  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const ariaRole = type === 'error' || type === 'warning' ? 'alert' : 'status';

  return (
    <div
      className={`toast toast-${type}`}
      role={ariaRole}
      aria-live="polite"
      aria-atomic="true"
      aria-label={message}
    >
      <span className="toast-icon" aria-hidden="true">
        {type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ'}
      </span>
      <span className="toast-message">{message}</span>
    </div>
  );
}

/**
 * Hook useToast para mostrar notificaciones
 */
function useToast() {
  const [toast, setToast] = React.useState(null);

  const showToast = (message, type = 'info', duration = 4000) => {
    setToast({ message, type, duration });
  };

  const hideToast = () => {
    setToast(null);
  };

  const ToastContainer = toast ? (
    <div className="toast-container" role="region" aria-live="polite" aria-atomic="true">
      <Toast
        message={toast.message}
        type={toast.type}
        duration={toast.duration}
        onClose={hideToast}
      />
    </div>
  ) : null;

  return { showToast, hideToast, ToastContainer };
}

export { Alert, Toast, useToast };
