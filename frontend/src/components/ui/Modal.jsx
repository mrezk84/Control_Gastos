import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Modal component - Modal reutilizable con backdrop
 */
function Modal({
  isOpen = false,
  onClose,
  title,
  children,
  footer,
  size = 'medium', // small, medium, large
  closeOnBackdrop = true,
  closeOnEscape = true,
  className = '',
}) {
  const modalRef = useRef(null);
  const previousActiveElementRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      // Ensure body scroll is restored when modal closes
      if (document.body.style.overflow === 'hidden') {
        document.body.style.overflow = '';
      }
      return;
    }

    // Store previous active element
    previousActiveElementRef.current = document.activeElement;

    // Focus trap
    setTimeout(() => {
      modalRef.current?.focus();
    }, 100);

    // Handle escape key
    const handleEscape = (e) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose();
      }
    };

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
      // Restore focus
      if (previousActiveElementRef.current && document.contains(previousActiveElementRef.current)) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  const modalClasses = [
    'modal-overlay',
    `modal-${size}`,
    className,
  ].filter(Boolean).join(' ');

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div className={modalClasses} onClick={handleBackdropClick}>
      <div
        ref={modalRef}
        className="modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        tabIndex={-1}
      >
        {title && (
          <div className="modal-header">
            <h2 id="modal-title" className="modal-title">{title}</h2>
            <button
              className="modal-close"
              onClick={onClose}
              aria-label="Cerrar modal"
              type="button"
            >
              ✕
            </button>
          </div>
        )}
        <div className="modal-body">
          {children}
        </div>
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default Modal;
