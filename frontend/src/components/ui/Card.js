import React from 'react';

/**
 * Card component - Tarjeta con efecto glassmorphism
 */
function Card({
  children,
  className = '',
  hover = false,
  glow = false,
  onClick,
  ...props
}) {
  const cardClasses = [
    'glass-card',
    hover && 'glass-card-hover',
    glow && 'glass-card-glow',
    onClick && 'glass-card-clickable',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} onClick={onClick} {...props}>
      {children}
    </div>
  );
}

export default Card;
