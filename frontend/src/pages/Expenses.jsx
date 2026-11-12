import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getExpenses, deleteExpense, exportExpensesCSV, exportExpensesExcel, importExpensesCSV } from '../services/api';
import ExpenseFilters from '../components/Filters/ExpenseFilters';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { formatDate, formatDateShort } from '../utils';
import { categoryIconClass } from '../utils/categoryIcons';
import Icon from '../components/ui/Icon';
import PageLoader from '../components/ui/PageLoader';
import { useMoney } from '../context/ExpensesContext';
import logger from '../utils/logger';
import { useToast } from '../components/ui/ToastContainer';
import { EXPENSE_CREATED_EVENT } from '../utils/events';

const PAGE_SIZE = 25;

const COLUMNS = [
  { key: 'description', label: 'Descripción' },
  { key: 'category', label: 'Categoría', className: 'cj-col-wide' },
  { key: 'date', label: 'Fecha', className: 'cj-col-wide' },
  { key: 'amount', label: 'Monto', className: 'cj-td-num' },
];

/**
 * Tabla de gastos con scroll infinito en el cliente: muestra `PAGE_SIZE` filas y va
 * revelando más cuando el centinela entra en pantalla, en vez de pintar toda la lista.
 * En pantallas angostas la categoría y la fecha pasan a una segunda línea bajo la descripción.
 */
function ExpensesTable({ expenses, sortBy, sortOrder, onSort, onDeleteClick }) {
  const { formatCurrency } = useMoney();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef(null);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [expenses]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, expenses.length));
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [expenses.length]);

  const visibleExpenses = expenses.slice(0, visibleCount);
  const hasMore = visibleCount < expenses.length;

  return (
    <>
      <table className="cj-table">
        <thead>
          <tr>
            {COLUMNS.map((col) => {
              const sorted = sortBy === col.key;
              return (
                <th
                  key={col.key}
                  scope="col"
                  className={col.className}
                  aria-sort={sorted ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <button type="button" className={`cj-th${sorted ? ' is-sorted' : ''}`} onClick={() => onSort(col.key)}>
                    {col.label}
                    <Icon name={sorted ? (sortOrder === 'asc' ? 'arrow-up' : 'arrow-down') : 'arrows-down-up'} />
                  </button>
                </th>
              );
            })}
            <th scope="col" className="cj-td-act"><span className="cj-sr">Acciones</span></th>
          </tr>
        </thead>
        <tbody>
          {visibleExpenses.map((expense) => (
            <tr key={expense.id}>
              <td className="cj-td-main">
                <div className="cj-td-flex">
                  <div className="cj-row-ico"><i className={categoryIconClass(expense.category)} aria-hidden="true" /></div>
                  <div className="cj-row-main">
                    <span className="cj-row-desc">{expense.description}</span>
                    <span className="cj-row-cat cj-only-narrow">{expense.category} · {formatDateShort(expense.date)}</span>
                  </div>
                </div>
              </td>
              <td className="cj-col-wide"><span className="cj-tag">{expense.category}</span></td>
              <td className="cj-col-wide cj-td-date">{formatDate(expense.date)}</td>
              <td className="cj-td-num">{formatCurrency(expense.amount)}</td>
              <td className="cj-td-act">
                <div className="cj-row-actions">
                  <button type="button" onClick={() => onDeleteClick(expense)} aria-label={`Eliminar ${expense.description}`} title="Eliminar">
                    <Icon name="trash" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {hasMore && (
        <div ref={sentinelRef} className="cj-table-more">
          <span className="cj-spinner" aria-hidden="true" />
          Cargando más gastos…
        </div>
      )}
    </>
  );
}

function Expenses() {
  const { formatCurrency } = useMoney();
  const [allExpenses, setAllExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    startDate: '',
    endDate: '',
    categories: [],
    minAmount: '',
    maxAmount: '',
    datePreset: 'all',
  });
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const fileInputRef = useRef(null);
  const exportRef = useRef(null);
  const { success, error } = useToast();

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Refresh when an expense is created anywhere in the app (FAB / Cmd+N).
  useEffect(() => {
    window.addEventListener(EXPENSE_CREATED_EVENT, fetchExpenses);
    return () => window.removeEventListener(EXPENSE_CREATED_EVENT, fetchExpenses);
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await getExpenses();
      // Handle paginated response
      setAllExpenses(res.data.items || res.data);
    } catch (err) {
      logger.apiError('Error fetching expenses', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return allExpenses.filter((expense) => {
      // Search filter
      if (filters.search) {
        const search = filters.search.toLowerCase();
        if (!expense.description.toLowerCase().includes(search)) {
          return false;
        }
      }

      // Fechas "YYYY-MM-DD": se comparan como texto, sin desfases de zona horaria
      const day = String(expense.date).slice(0, 10);
      if (filters.startDate && day < filters.startDate) return false;
      if (filters.endDate && day > filters.endDate) return false;

      // Category filter
      if (filters.categories && filters.categories.length > 0) {
        if (!filters.categories.includes(expense.category)) {
          return false;
        }
      }

      // Amount filter
      if (filters.minAmount !== '' && expense.amount < filters.minAmount) return false;
      if (filters.maxAmount !== '' && expense.amount > filters.maxAmount) return false;

      return true;
    });
  }, [allExpenses, filters]);

  // Sort expenses
  const sortedExpenses = useMemo(() => {
    return [...filteredExpenses].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === 'amount') {
        aVal = parseFloat(aVal);
        bVal = parseFloat(bVal);
      } else if (sortBy === 'date') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      } else {
        aVal = aVal?.toString().toLowerCase() || '';
        bVal = bVal?.toString().toLowerCase() || '';
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }, [filteredExpenses, sortBy, sortOrder]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      startDate: '',
      endDate: '',
      categories: [],
      minAmount: '',
      maxAmount: '',
      datePreset: 'all',
    });
  };

  const handleDeleteClick = (expense) => {
    setExpenseToDelete(expense);
    setShowConfirmDialog(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!expenseToDelete) return;
    const toDelete = expenseToDelete;
    setExpenseToDelete(null);

    // Optimistic UI: remove immediately and roll back if the request fails,
    // instead of waiting for the server before the row disappears.
    setAllExpenses((prev) => prev.filter((e) => e.id !== toDelete.id));
    success('Gasto eliminado correctamente');

    try {
      await deleteExpense(toDelete.id);
    } catch (err) {
      logger.apiError('Error deleting expense', err);
      setAllExpenses((prev) => [...prev, toDelete]);
      error('No se pudo eliminar el gasto, se restauró');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await exportExpensesCSV({
        startDate: filters.startDate,
        endDate: filters.endDate,
        category: filters.categories?.length === 1 ? filters.categories[0] : null,
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `gastos_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      success('Archivo CSV exportado correctamente');
    } catch (err) {
      logger.apiError('Error exporting CSV', err);
      error('Error al exportar los datos');
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await exportExpensesExcel({
        startDate: filters.startDate,
        endDate: filters.endDate,
        category: filters.categories?.length === 1 ? filters.categories[0] : null,
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `gastos_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      success('Archivo Excel exportado correctamente');
    } catch (err) {
      logger.apiError('Error exporting Excel', err);
      error('Error al exportar a Excel. Asegúrate de tener gastos para exportar.');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      error('El archivo debe ser un CSV');
      return;
    }

    setImporting(true);
    try {
      const response = await importExpensesCSV(file);
      const { imported, total_rows, error_count, errors } = response.data;

      if (imported > 0) {
        success(`${imported} de ${total_rows} gastos importados correctamente`);
        await fetchExpenses();
      }

      if (error_count > 0) {
        if (imported === 0) {
          error(`No se pudo importar ningún gasto. ${errors.slice(0, 3).join(', ')}`);
        } else {
          error(`${error_count} filas con errores: ${errors.slice(0, 3).join(', ')}`);
        }
      }
    } catch (err) {
      logger.apiError('Error importing CSV', err);
      error('Error al importar el archivo CSV');
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // El menú de exportar se cierra al hacer clic fuera o con Escape
  useEffect(() => {
    if (!showExportMenu) return undefined;
    const onDown = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setShowExportMenu(false); };
    const onKey = (e) => { if (e.key === 'Escape') setShowExportMenu(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [showExportMenu]);

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const count = filteredExpenses.length;
  const filtered = count !== allExpenses.length;

  if (loading) {
    return <PageLoader label="Cargando gastos…" />;
  }

  return (
    <div className="cj-page">
      <header className="cj-head">
        <div>
          <span className="cj-eyebrow">Movimientos · {allExpenses.length} {allExpenses.length === 1 ? 'registro' : 'registros'}</span>
          <h1 className="cj-greeting">Gastos</h1>
        </div>
        <div className="cj-head-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            aria-label="Seleccionar archivo CSV para importar"
          />
          <button
            type="button"
            className="cj-act"
            onClick={handleImportClick}
            disabled={importing}
            title="Importar gastos desde un archivo CSV"
          >
            <Icon name={importing ? 'hourglass' : 'upload-simple'} />
            {importing ? 'Importando…' : 'Importar'}
          </button>
          <div className="cj-pop" ref={exportRef}>
            <button
              type="button"
              className="cj-act"
              aria-haspopup="menu"
              aria-expanded={showExportMenu}
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={count === 0}
            >
              <Icon name="download-simple" /> Exportar <Icon name="caret-down" />
            </button>
            {showExportMenu && (
              <div className="cj-menu cj-pop-menu" role="menu">
                <button type="button" role="menuitem" className="cj-menu-item" onClick={() => { handleExportCSV(); setShowExportMenu(false); }}>
                  <Icon name="file-csv" /> CSV
                </button>
                <button type="button" role="menuitem" className="cj-menu-item" onClick={() => { handleExportExcel(); setShowExportMenu(false); }}>
                  <Icon name="file-xls" /> Excel
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <ExpenseFilters filters={filters} onChange={setFilters} onClear={clearFilters} />

      <section className="cj-card cj-table-card" aria-label="Lista de gastos">
        <div className="cj-card-head">
          <h2 className="cj-card-title">
            <Icon name="receipt" />
            {filtered ? 'Resultados' : 'Todos los gastos'}
          </h2>
          <div className="cj-table-sum">
            <span>{count} {count === 1 ? 'gasto' : 'gastos'}</span>
            <b>{formatCurrency(totalAmount)}</b>
          </div>
        </div>

        {sortedExpenses.length === 0 ? (
          <EmptyState
            icon={<Icon name="receipt" duotone />}
            title={allExpenses.length === 0 ? 'Todavía no hay gastos' : 'Sin resultados'}
            description={
              allExpenses.length === 0
                ? 'Registra el primero desde el Panel o importa un archivo CSV.'
                : 'Ningún gasto coincide con los filtros aplicados.'
            }
            action={allExpenses.length > 0 && (
              <button type="button" className="cj-act" onClick={clearFilters}>
                Limpiar filtros
              </button>
            )}
          />
        ) : (
          <ExpensesTable
            expenses={sortedExpenses}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            onDeleteClick={handleDeleteClick}
          />
        )}
      </section>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleDeleteConfirmed}
        title="¿Eliminar gasto?"
        message={expenseToDelete ? `${expenseToDelete.description} · ${formatCurrency(expenseToDelete.amount)}. Esta acción no se puede deshacer.` : ''}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        icon={<Icon name="trash" duotone />}
      />
    </div>
  );
}

export default Expenses;
