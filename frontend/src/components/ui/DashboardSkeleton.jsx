import React from 'react';
import './Skeleton.css';

/**
 * Dashboard Skeleton - Loading state para Dashboard
 * Muestra KPI cards y gráficos mientras cargan
 */
function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton">
      {/* Header Skeleton */}
      <div className="dashboard-header-skeleton">
        <Skeleton variant="text" width="200px" height="32px" />
        <Skeleton variant="text" width="300px" height="16px" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="kpi-grid-skeleton">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="kpi-card-skeleton">
            <div className="kpi-icon-skeleton">
              <Skeleton variant="circle" width={56} height={56} />
            </div>
            <div className="kpi-content-skeleton">
              <Skeleton variant="text" width="80px" height="12px" />
              <Skeleton variant="text" width="120px" height="28px" className="mt-2" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="charts-grid-skeleton">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="chart-card-skeleton">
            <Skeleton variant="text" width="150px" height="20px" />
            <div className="chart-placeholder-skeleton">
              <Skeleton variant="rect" width="100%" height={280} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Expenses Skeleton - Loading state para página de gastos
 */
function ExpensesSkeleton() {
  return (
    <div className="expenses-skeleton">
      <div className="expenses-header-skeleton">
        <Skeleton variant="text" width="150px" height="28px" />
        <Skeleton variant="text" width="250px" height="16px" />
      </div>

      {/* Table Skeleton */}
      <div className="expenses-table-skeleton">
        <div className="expenses-table-header-skeleton">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="text" width="80px" height="14px" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="expenses-table-row-skeleton">
            <Skeleton variant="text" width="120px" height="16px" />
            <Skeleton variant="rect" width="80px" height="24px" className="badge-skeleton" />
            <Skeleton variant="text" width="80px" height="16px" />
            <Skeleton variant="text" width="80px" height="16px" />
            <Skeleton variant="circle" width={32} height={32} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Analytics Skeleton - Loading state para página de analíticas
 */
function AnalyticsSkeleton() {
  return (
    <div className="analytics-skeleton">
      <div className="analytics-header-skeleton">
        <Skeleton variant="text" width="150px" height="28px" />
        <Skeleton variant="rect" width="120px" height="36px" />
      </div>

      {/* KPIs Skeleton */}
      <div className="analytics-kpi-skeleton">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="analytics-kpi-card-skeleton">
            <Skeleton variant="circle" width={48} height={48} />
            <Skeleton variant="text" width="60px" height="12px" />
            <Skeleton variant="text" width="100px" height="24px" />
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="analytics-charts-skeleton">
        <div className="chart-large-skeleton">
          <Skeleton variant="text" width="180px" height="18px" />
          <Skeleton variant="rect" width="100%" height={320} />
        </div>
        <div className="chart-small-skeleton">
          <Skeleton variant="text" width="150px" height="18px" />
          <Skeleton variant="rect" width="100%" height={280} />
        </div>
      </div>
    </div>
  );
}

/**
 * Budgets Skeleton - Loading state para página de presupuestos
 */
function BudgetsSkeleton() {
  return (
    <div className="budgets-skeleton">
      <div className="budgets-header-skeleton">
        <Skeleton variant="text" width="150px" height="28px" />
        <Skeleton variant="text" width="200px" height="16px" />
      </div>

      {/* Summary Cards Skeleton */}
      <div className="budgets-summary-skeleton">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="budget-summary-card-skeleton">
            <Skeleton variant="text" width="60px" height="12px" />
            <Skeleton variant="text" width="100px" height="24px" />
          </div>
        ))}
      </div>

      {/* Budget Cards Skeleton */}
      <div className="budgets-list-skeleton">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="budget-card-skeleton">
            <div className="budget-header-skeleton">
              <Skeleton variant="text" width="120px" height="18px" />
              <Skeleton variant="circle" width={32} height={32} />
            </div>
            <Skeleton variant="rect" width="100%" height={8} className="progress-skeleton" />
            <div className="budget-details-skeleton">
              <Skeleton variant="text" width="80px" height="14px" />
              <Skeleton variant="text" width="60px" height="14px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Base Skeleton component
function Skeleton({ variant = 'text', width, height, className = '' }) {
  const skeletonClasses = ['skeleton', `skeleton-${variant}`, className].join(' ');
  const style = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return <div className={skeletonClasses} style={style} />;
}

export {
  DashboardSkeleton,
  ExpensesSkeleton,
  AnalyticsSkeleton,
  BudgetsSkeleton,
  Skeleton,
};
