import React, { useState } from 'react';
import Icon from '../ui/Icon';
import { CATEGORIES } from '../../utils/constants';
import { formatDateForInput } from '../../utils/formatters';
import { categoryIconClass } from '../../utils/categoryIcons';

const DATE_PRESETS = [
  { label: 'Todo', value: 'all' },
  { label: 'Hoy', value: 'today' },
  { label: '7 días', value: 'week' },
  { label: 'Este mes', value: 'month' },
  { label: 'Mes anterior', value: 'lastMonth' },
  { label: 'Este año', value: 'year' },
];

/** Rango de fechas (en hora local) de cada período rápido. */
export function presetRange(preset, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const iso = formatDateForInput;
  switch (preset) {
    case 'today':
      return { startDate: iso(today), endDate: iso(today) };
    case 'week': {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      return { startDate: iso(from), endDate: iso(today) };
    }
    case 'month':
      return { startDate: iso(new Date(today.getFullYear(), today.getMonth(), 1)), endDate: iso(today) };
    case 'lastMonth':
      return {
        startDate: iso(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
        endDate: iso(new Date(today.getFullYear(), today.getMonth(), 0)),
      };
    case 'year':
      return { startDate: iso(new Date(today.getFullYear(), 0, 1)), endDate: iso(today) };
    default:
      return { startDate: '', endDate: '' };
  }
}

/**
 * Barra de filtros de Gastos: búsqueda y período siempre a la vista; categorías,
 * fechas a medida y montos en un panel que se despliega. Los filtros se aplican al instante.
 */
function ExpenseFilters({ filters, onChange, onClear }) {
  const [open, setOpen] = useState(false);
  const patch = (changes) => onChange({ ...filters, ...changes });

  const categories = filters.categories || [];
  const customDates = filters.datePreset === 'custom' && (filters.startDate || filters.endDate);
  const hasAmount = filters.minAmount !== '' || filters.maxAmount !== '';
  const advancedCount = (categories.length > 0 ? 1 : 0) + (customDates ? 1 : 0) + (hasAmount ? 1 : 0);
  const hasActive = advancedCount > 0 || Boolean(filters.search) || (filters.datePreset && filters.datePreset !== 'all');

  const toggleCategory = (category) => {
    patch({
      categories: categories.includes(category)
        ? categories.filter((c) => c !== category)
        : [...categories, category],
    });
  };

  const amount = (value) => (value === '' ? '' : parseFloat(value));

  return (
    <section className="cj-filters" aria-label="Filtros de gastos">
      <div className="cj-filters-bar">
        <div className="cj-search">
          <Icon name="magnifying-glass" />
          <input
            id="expense-search"
            type="search"
            placeholder="Buscar por descripción"
            value={filters.search || ''}
            onChange={(e) => patch({ search: e.target.value })}
            aria-label="Buscar gasto por descripción"
          />
          {filters.search && (
            <button type="button" onClick={() => patch({ search: '' })} aria-label="Limpiar búsqueda">
              <Icon name="x" />
            </button>
          )}
        </div>

        <div className="cj-chips cj-chips-scroll" role="group" aria-label="Período">
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              className="cj-chip"
              aria-pressed={filters.datePreset === preset.value}
              onClick={() => patch({ ...presetRange(preset.value), datePreset: preset.value })}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="cj-filters-end">
          {hasActive && (
            <button type="button" className="cj-link-btn" onClick={onClear}>
              Limpiar
            </button>
          )}
          <button
            type="button"
            className="cj-act"
            aria-expanded={open}
            aria-controls="expense-filters-more"
            onClick={() => setOpen((o) => !o)}
          >
            <Icon name="sliders-horizontal" />
            Filtros
            {advancedCount > 0 && <span className="cj-count">{advancedCount}</span>}
          </button>
        </div>
      </div>

      {open && (
        <div className="cj-filters-more" id="expense-filters-more">
          <fieldset className="cj-fieldset">
            <legend>Categorías</legend>
            <div className="cj-chips">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  className="cj-chip"
                  aria-pressed={categories.includes(category)}
                  onClick={() => toggleCategory(category)}
                >
                  <i className={categoryIconClass(category)} aria-hidden="true" />
                  {category}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="cj-filters-grid">
            <label className="cj-label">
              <span>Desde</span>
              <input
                type="date"
                className="cj-field cj-date"
                value={filters.startDate || ''}
                max={filters.endDate || undefined}
                onChange={(e) => patch({ startDate: e.target.value, datePreset: 'custom' })}
              />
            </label>
            <label className="cj-label">
              <span>Hasta</span>
              <input
                type="date"
                className="cj-field cj-date"
                value={filters.endDate || ''}
                min={filters.startDate || undefined}
                onChange={(e) => patch({ endDate: e.target.value, datePreset: 'custom' })}
              />
            </label>
            <label className="cj-label">
              <span>Monto mínimo</span>
              <input
                type="number"
                inputMode="decimal"
                className="cj-field cj-date"
                placeholder="0"
                min="0"
                step="0.01"
                value={filters.minAmount}
                onChange={(e) => patch({ minAmount: amount(e.target.value) })}
              />
            </label>
            <label className="cj-label">
              <span>Monto máximo</span>
              <input
                type="number"
                inputMode="decimal"
                className="cj-field cj-date"
                placeholder="Sin límite"
                min="0"
                step="0.01"
                value={filters.maxAmount}
                onChange={(e) => patch({ maxAmount: amount(e.target.value) })}
              />
            </label>
          </div>
        </div>
      )}
    </section>
  );
}

export default ExpenseFilters;
