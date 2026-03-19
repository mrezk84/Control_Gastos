import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Toast component - Notificaciones toast
 */
function Toast({
  message,
  type = 'info', // success, error, warning, info
  duration = 4000,
  onClose,
  className = '',
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  if (!isVisible) return null;

  const toastClasses = [
    'toast',
    `toast-${type}`,
    isExiting && 'toast-exiting',
    className,
  ].filter(Boolean).join(' ');

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return createPortal(
    <div className={toastClasses} onClick={handleClose}>
      <span className="toast-icon">{icons[type]}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={handleClose} aria-label="Cerrar">
        ✕
      </button>
    </div>,
    document.body
  );
}

/**
 * ToastContainer - Contenedor para múltiples toasts
 */
function ToastContainer({ toasts = [], position = 'top-right' }) {
  return createPortal(
    <div className={`toast-container toast-container-${position}`}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
        />
      ))}
    </div>,
    document.body
  );
}

export { ToastContainer };
export default Toast;
