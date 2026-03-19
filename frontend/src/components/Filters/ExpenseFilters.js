import React from 'react';

const CATEGORIES = [
  'Alimentación',
  'Transporte',
  'Entretenimiento',
  'Salud',
  'Servicios',
  'Educación',
  'Vivienda',
  'Ropa',
  'Tecnología',
  'Otros',
];

const DATE_PRESETS = [
  { label: 'Todos', value: 'all' },
  { label: 'Hoy', value: 'today' },
  { label: 'Esta semana', value: 'week' },
  { label: 'Este mes', value: 'month' },
  { label: 'Mes anterior', value: 'lastMonth' },
  { label: 'Este año', value: 'year' },
];

function ExpenseFilters({ filters, onChange, onClear, onSearch }) {
  const updateFilter = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  const handleSearch = () => {
    if (onSearch) onSearch();
  };

  const getDateRange = (preset) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (preset) {
      case 'today':
        return { start: today.toISOString().split('T')[0], end: today.toISOString().split('T')[0] };
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return { start: weekAgo.toISOString().split('T')[0], end: today.toISOString().split('T')[0] };
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return { start: monthStart.toISOString().split('T')[0], end: today.toISOString().split('T')[0] };
      case 'lastMonth':
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        return { start: lastMonthStart.toISOString().split('T')[0], end: lastMonthEnd.toISOString().split('T')[0] };
      case 'year':
        const yearStart = new Date(today.getFullYear(), 0, 1);
        return { start: yearStart.toISOString().split('T')[0], end: today.toISOString().split('T')[0] };
      default:
        return { start: '', end: '' };
    }
  };

  const handleDatePresetChange = (preset) => {
    const range = getDateRange(preset);
    updateFilter('startDate', range.start);
    updateFilter('endDate', range.end);
    updateFilter('datePreset', preset);
  };

  const toggleCategory = (category) => {
    const current = filters.categories || [];
    const updated = current.includes(category)
      ? current.filter(c => c !== category)
      : [...current, category];
    updateFilter('categories', updated);
  };

  const hasActiveFilters = () => {
    return filters.search ||
           filters.startDate ||
           filters.endDate ||
           (filters.categories && filters.categories.length > 0) ||
           filters.minAmount ||
           filters.maxAmount;
  };

  const activeFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.startDate || filters.endDate) count++;
    if (filters.categories && filters.categories.length > 0) count++;
    if (filters.minAmount || filters.maxAmount) count++;
    return count;
  };

  return (
    <div className="filters-container" role="region" aria-label="Filtros de gastos">
      <div className="filters-header">
        <h3 className="filters-title">
          <span aria-hidden="true">🔍</span>
          <span className="sr-only">Filtros</span>
        </h3>
        {hasActiveFilters() && (
          <button
            className="filters-clear"
            onClick={onClear}
            aria-label={`Limpiar ${activeFilterCount()} filtros activos`}
          >
            Limpiar ({activeFilterCount()})
          </button>
        )}
      </div>

      <div className="filters-content">
        {/* Search */}
        <div className="filter-group filter-search-group">
          <label htmlFor="expense-search" className="filter-label" id="expense-search-label">
            Buscar
          </label>
          <div className="filter-search-wrapper">
            <span className="filter-search-icon" aria-hidden="true">🔍</span>
            <input
              id="expense-search"
              type="text"
              className="filter-input filter-search-input"
              placeholder="Descripción del gasto..."
              value={filters.search || ''}
              onChange={(e) => updateFilter('search', e.target.value)}
              aria-label="Buscar gasto por descripción"
            />
            {filters.search && (
              <button
                className="filter-search-clear"
                onClick={() => updateFilter('search', '')}
                aria-label="Limpiar búsqueda"
                type="button"
              >
                <span aria-hidden="true">✕</span>
              </button>
            )}
          </div>
        </div>

        {/* Date Presets */}
        <fieldset className="filter-group">
          <legend className="filter-label">Período</legend>
          <div className="filter-presets" role="group" aria-label="Seleccionar período de tiempo">
            {DATE_PRESETS.map((preset) => (
              <button
                key={preset.value}
                className={`filter-preset ${filters.datePreset === preset.value ? 'active' : ''}`}
                onClick={() => handleDatePresetChange(preset.value)}
                aria-pressed={filters.datePreset === preset.value}
                type="button"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Date Range */}
        <div className="filter-row" role="group" aria-label="Rango de fechas personalizado">
          <div className="filter-group">
            <label htmlFor="expense-date-from" className="filter-label">
              Desde
            </label>
            <input
              id="expense-date-from"
              type="date"
              className="filter-input"
              value={filters.startDate || ''}
              onChange={(e) => {
                updateFilter('startDate', e.target.value);
                updateFilter('datePreset', 'custom');
              }}
              aria-label="Fecha de inicio"
            />
          </div>
          <div className="filter-group">
            <label htmlFor="expense-date-to" className="filter-label">
              Hasta
            </label>
            <input
              id="expense-date-to"
              type="date"
              className="filter-input"
              value={filters.endDate || ''}
              onChange={(e) => {
                updateFilter('endDate', e.target.value);
                updateFilter('datePreset', 'custom');
              }}
              aria-label="Fecha de fin"
            />
          </div>
        </div>

        {/* Categories */}
        <fieldset className="filter-group">
          <legend className="filter-label">Categorías</legend>
          <div className="filter-categories" role="group" aria-label="Filtrar por categorías">
            {CATEGORIES.map((category) => {
              const isSelected = filters.categories?.includes(category);
              return (
                <button
                  key={category}
                  className={`filter-category-chip ${isSelected ? 'active' : ''}`}
                  onClick={() => toggleCategory(category)}
                  aria-pressed={isSelected}
                  type="button"
                >
                  {category}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Amount Range */}
        <div className="filter-row" role="group" aria-label="Rango de monto">
          <div className="filter-group">
            <label htmlFor="expense-amount-min" className="filter-label">
              Mínimo $
            </label>
            <input
              id="expense-amount-min"
              type="number"
              className="filter-input"
              placeholder="0"
              min="0"
              step="0.01"
              value={filters.minAmount || ''}
              onChange={(e) => updateFilter('minAmount', e.target.value ? parseFloat(e.target.value) : '')}
              aria-label="Monto mínimo del gasto"
            />
          </div>
          <div className="filter-group">
            <label htmlFor="expense-amount-max" className="filter-label">
              Máximo $
            </label>
            <input
              id="expense-amount-max"
              type="number"
              className="filter-input"
              placeholder="Sin límite"
              min="0"
              step="0.01"
              value={filters.maxAmount || ''}
              onChange={(e) => updateFilter('maxAmount', e.target.value ? parseFloat(e.target.value) : '')}
              aria-label="Monto máximo del gasto"
            />
          </div>
        </div>

        {/* Search Button */}
        <div className="filter-actions">
          <button
            className="filter-search-btn"
            onClick={handleSearch}
            aria-label="Aplicar filtros y buscar"
            type="button"
          >
            <span aria-hidden="true">🔍</span>
            <span>Buscar Gastos</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExpenseFilters;
