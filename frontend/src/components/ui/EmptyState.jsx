import React from 'react';

/**
 * EmptyState component - Estados vacíos consistentes
 */
function EmptyState({
  icon = '📭',
  title = 'No hay datos',
  description,
  action = null,
  className = '',
}) {
  return (
    <div className={`empty-state ${className}`}>
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}

export default EmptyState;
