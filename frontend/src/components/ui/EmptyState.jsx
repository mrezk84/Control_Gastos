import React from 'react';
import './EmptyState.css';

/**
 * EmptyState - Componente mejorado para estados vacíos
 * Con ilustraciones SVG opcionales y más personalización
 */
function EmptyState({
  icon = 'inbox',
  title = 'No hay datos',
  description,
  action = null,
  variant = 'default',
  size = 'medium',
  className = '',
}) {
  const icons = {
    inbox: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M22 12h-6l-2 3h-4l-2-3H2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    search: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    chart: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 3v18h18" />
        <path d="M18 17V9" />
        <path d="M13 17V5" />
        <path d="M8 17v-3" />
      </svg>
    ),
    wallet: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
        <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
        <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
      </svg>
    ),
    folder: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
    filter: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
      </svg>
    ),
  };

  const sizeClasses = {
    small: 'empty-state-small',
    medium: 'empty-state-medium',
    large: 'empty-state-large',
  };

  const classes = [
    'empty-state',
    `empty-state-${variant}`,
    sizeClasses[size],
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <div className="empty-state-icon-wrapper">
        <div className="empty-state-icon">{icons[icon] || icons.inbox}</div>
        {variant === 'gradient' && (
          <div className="empty-state-icon-glow"></div>
        )}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}

/**
 * EmptyStateCard - Variante con tarjeta para usar dentro de cards
 */
function EmptyStateCard({
  icon,
  title,
  description,
  action,
}) {
  return (
    <div className="empty-state-card">
      <EmptyState
        icon={icon}
        title={title}
        description={description}
        action={action}
        variant="card"
        size="small"
      />
    </div>
  );
}

/**
 * InlineEmptyState - Versión compacta para usar en línea
 */
function InlineEmptyState({
  icon = 'folder',
  message = 'Sin resultados',
}) {
  return (
    <div className="inline-empty-state">
      <span className="inline-empty-icon">{icon === 'folder' ? '📁' : icon}</span>
      <span className="inline-empty-message">{message}</span>
    </div>
  );
}

export {
  EmptyState,
  EmptyStateCard,
  InlineEmptyState,
};
