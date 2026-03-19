import React from 'react';

/**
 * Badge component - Badges de categoría con variantes de color
 */
function Badge({
  children,
  variant = 'default', // default, purple, blue, green, orange, pink, red
  size = 'medium', // small, medium, large
  className = '',
  ...props
}) {
  const badgeClasses = [
    'badge',
    `badge-${variant}`,
    `badge-${size}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={badgeClasses} {...props}>
      {children}
    </span>
  );
}

export default Badge;
