import React from 'react';

/**
 * Skeleton component - Skeletons para estados de carga
 */
function Skeleton({
  variant = 'text', // text, circle, rect, custom
  width,
  height,
  className = '',
  ...props
}) {
  const skeletonClasses = [
    'skeleton',
    `skeleton-${variant}`,
    className,
  ].filter(Boolean).join(' ');

  const style = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div className={skeletonClasses} style={style} {...props} />
  );
}

/**
 * SkeletonCard - Tarjeta skeleton para loading
 */
function SkeletonCard({ className = '' }) {
  return (
    <div className={`skeleton-card ${className}`}>
      <Skeleton variant="rect" width="100%" height={200} />
    </div>
  );
}

/**
 * SkeletonTable - Tabla skeleton para loading
 */
function SkeletonTable({ rows = 5, columns = 4 }) {
  return (
    <div className="skeleton-table">
      <div className="skeleton-table-header">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" height={20} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-table-row">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} variant="text" height={16} />
          ))}
        </div>
      ))}
    </div>
  );
}

export { SkeletonCard, SkeletonTable };
export default Skeleton;
