import React, { useEffect } from 'react';
import './ConfirmDialog.css';

/**
 * Elegant confirmation dialog component
 *
 * @param {boolean} isOpen - Whether the dialog is visible
 * @param {function} onClose - Callback when dialog is closed without confirmation
 * @param {function} onConfirm - Callback when user confirms
 * @param {string} title - Dialog title
 * @param {string} message - Confirmation message
 * @param {string} confirmText - Text for confirm button (default: "Confirmar")
 * @param {string} cancelText - Text for cancel button (default: "Cancelar")
 * @param {string} type - Dialog type: 'danger' | 'warning' | 'info' (default: 'danger')
 * @param {string} icon - Icon to display (optional)
 */
function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger',
  icon
}) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const typeIcons = {
    danger: '⚠️',
    warning: '⚡',
    info: 'ℹ️'
  };

  const displayIcon = icon || typeIcons[type] || typeIcons.danger;

  // Handle escape key (must be before early return)
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="confirm-overlay"
      onClick={handleBackdropClick}
      aria-labelledby="confirm-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="confirm-dialog">
        <div className={`confirm-icon confirm-icon-${type}`}>
          {displayIcon}
        </div>

        <h2 id="confirm-title" className="confirm-title">
          {title}
        </h2>

        {message && (
          <p className="confirm-message">
            {message}
          </p>
        )}

        <div className="confirm-actions">
          <button
            className="confirm-btn confirm-btn-cancel"
            onClick={onClose}
            type="button"
          >
            {cancelText}
          </button>
          <button
            className={`confirm-btn confirm-btn-${type}`}
            onClick={handleConfirm}
            type="button"
            autoFocus
          >
            {confirmText}
          </button>
        </div>

        <button
          className="confirm-close-icon"
          onClick={onClose}
          aria-label="Cerrar"
          type="button"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default ConfirmDialog;
