import React from 'react';
import { CATEGORY_COLORS, CATEGORY_EMOJIS } from '../../utils';

/**
 * Componente Badge para categorías de gastos
 * @param {Object} props
 * @param {string} props.category - Nombre de la categoría
 * @param {boolean} props.showEmoji - Si debe mostrar el emoji (default: true)
 * @param {string} props.className - Clases adicionales
 */
function CategoryBadge({ category, showEmoji = true, className = '' }) {
  const colorClass = CATEGORY_COLORS[category] || 'gray';
  const emoji = CATEGORY_EMOJIS[category] || '📦';

  return (
    <span
      className={`category-badge category-${colorClass} ${className}`}
      role="img"
      aria-label={`Categoría: ${category}`}
    >
      {showEmoji && <span className="category-emoji">{emoji}</span>}
      <span className="category-name">{category}</span>
    </span>
  );
}

export default CategoryBadge;
