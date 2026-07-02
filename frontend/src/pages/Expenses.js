import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getExpenses, deleteExpense, exportExpensesCSV, exportExpensesExcel, importExpensesCSV } from '../services/api';
import ExpenseFilters from '../components/Filters/ExpenseFilters';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { CATEGORY_EMOJIS, CATEGORY_COLORS, formatCurrency, formatDate } from '../utils';
import logger from '../utils/logger';
import { useToast } from '../components/ui/ToastContainer';

function Expenses() {
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
  const [showFilters, setShowFilters] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const fileInputRef = useRef(null);
  const { success, error } = useToast();

  useEffect(() => {
    fetchExpenses();
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

      // Date filter
      if (filters.startDate) {
        const expenseDate = new Date(expense.date);
        const startDate = new Date(filters.startDate);
        if (expenseDate < startDate) return false;
      }
      if (filters.endDate) {
        const expenseDate = new Date(expense.date);
        const endDate = new Date(filters.endDate);
        if (expenseDate > endDate) return false;
      }

      // Category filter
      if (filters.categories && filters.categories.length > 0) {
        if (!filters.categories.includes(expense.category)) {
          return false;
        }
      }

      // Amount filter
      if (filters.minAmount && expense.amount < filters.minAmount) return false;
      if (filters.maxAmount && expense.amount > filters.maxAmount) return false;

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

    try {
      await deleteExpense(expenseToDelete.id);
      setAllExpenses(allExpenses.filter(e => e.id !== expenseToDelete.id));
      success('✅ Gasto eliminado correctamente');
    } catch (err) {
      logger.apiError('Error deleting expense', err);
      error('❌ Error al eliminar el gasto');
    } finally {
      setExpenseToDelete(null);
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
      success('📄 Archivo CSV exportado correctamente');
    } catch (err) {
      logger.apiError('Error exporting CSV', err);
      error('❌ Error al exportar los datos');
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
      success('📊 Archivo Excel exportado correctamente');
    } catch (err) {
      logger.apiError('Error exporting Excel', err);
      error('❌ Error al exportar a Excel. Asegúrate de tener gastos para exportar.');
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
        success(`✅ ${imported} de ${total_rows} gastos importados correctamente`);
        await fetchExpenses();
      }

      if (error_count > 0) {
        if (imported === 0) {
          error(`❌ No se pudo importar ningún gasto. ${errors.slice(0, 3).join(', ')}`);
        } else {
          error(`⚠️ ${error_count} filas con errores: ${errors.slice(0, 3).join(', ')}`);
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

  // Calculate totals
  const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  if (loading) {
    return (
      <div className="expenses-loading">
        <div className="spinner" />
        <p>Cargando gastos...</p>
      </div>
    );
  }

  return (
    <div className="expenses-container">
      {showFilters ? (
        <div className="expenses-layout">
          <aside className="expenses-filters">
            <ExpenseFilters
              filters={filters}
              onChange={setFilters}
              onClear={clearFilters}
            />
          </aside>

          <main className="expenses-main">
            <div className="page-header">
              <div>
                <h1 className="page-title">💸 Gastos</h1>
                <p className="page-subtitle">
                  {filteredExpenses.length} {filteredExpenses.length === 1 ? 'gasto' : 'gastos'}
                  {filteredExpenses.length > 0 && ` · Total: ${formatCurrency(totalAmount)}`}
                </p>
              </div>
              <div className="page-header-actions">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  aria-label="Seleccionar archivo CSV para importar"
                />
                <button
                  className="btn btn-secondary"
                  onClick={handleImportClick}
                  disabled={importing}
                  title="Importar gastos desde un archivo CSV"
                >
                  {importing ? '⏳ Importando...' : '📤 Importar'}
                </button>
                <div className="export-dropdown">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    disabled={filteredExpenses.length === 0}
                  >
                    📥 Exportar ▼
                  </button>
                  {showExportMenu && (
                    <div className="export-menu">
                      <button
                        className="export-menu-item"
                        onClick={() => {
                          handleExportCSV();
                          setShowExportMenu(false);
                        }}
                      >
                        📄 Exportar como CSV
                      </button>
                      <button
                        className="export-menu-item"
                        onClick={() => {
                          handleExportExcel();
                          setShowExportMenu(false);
                        }}
                      >
                        📊 Exportar como Excel
                      </button>
                    </div>
                  )}
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowFilters(false)}
                >
                  🙈 Ocultar Filtros
                </button>
              </div>
            </div>

            {sortedExpenses.length === 0 ? (
              <EmptyState
                icon="💭"
                title="No se encontraron gastos"
                description={
                  allExpenses.length === 0
                    ? 'Todavía no tenés gastos registrados. ¡Agregá el primero!'
                    : 'No hay gastos que coincidan con los filtros aplicados.'
                }
                action={allExpenses.length > 0 && (
                  <button className="btn btn-secondary" onClick={clearFilters}>
                    Limpiar filtros
                  </button>
                )}
              />
            ) : (
              <div className="expenses-table-wrapper">
                <table className="expenses-table">
                  <thead>
                    <tr>
                      <th
                        className={`sortable ${sortBy === 'description' ? `sorted-${sortOrder}` : ''}`}
                        onClick={() => handleSort('description')}
                      >
                        Descripción {sortBy === 'description' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th
                        className={`sortable ${sortBy === 'category' ? `sorted-${sortOrder}` : ''}`}
                        onClick={() => handleSort('category')}
                      >
                        Categoría {sortBy === 'category' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th
                        className={`sortable ${sortBy === 'amount' ? `sorted-${sortOrder}` : ''}`}
                        onClick={() => handleSort('amount')}
                      >
                        Monto {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th
                        className={`sortable ${sortBy === 'date' ? `sorted-${sortOrder}` : ''}`}
                        onClick={() => handleSort('date')}
                      >
                        Fecha {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedExpenses.map((expense, index) => (
                      <tr key={expense.id} style={{ animationDelay: `${index * 0.03}s` }}>
                        <td className="expenses-description">{expense.description}</td>
                        <td>
                          <span className={`category-badge category-${CATEGORY_COLORS[expense.category] || 'default'}`}>
                            {CATEGORY_EMOJIS[expense.category] || '📦'} {expense.category}
                          </span>
                        </td>
                        <td className="expenses-amount">{formatCurrency(expense.amount)}</td>
                        <td className="expenses-date">{formatDate(expense.date)}</td>
                        <td className="expenses-actions">
                          <button
                            className="expenses-action-btn expenses-action-delete"
                            onClick={() => handleDeleteClick(expense)}
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </main>
        </div>
      ) : (
        <div className="expenses-main full-width">
          <div className="page-header">
            <div>
              <h1 className="page-title">💸 Gastos</h1>
              <p className="page-subtitle">
                {filteredExpenses.length} {filteredExpenses.length === 1 ? 'gasto' : 'gastos'}
                {filteredExpenses.length > 0 && ` · Total: ${formatCurrency(totalAmount)}`}
              </p>
            </div>
            <div className="page-header-actions">
              <div className="export-dropdown">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={filteredExpenses.length === 0}
                >
                  📥 Exportar ▼
                </button>
                {showExportMenu && (
                  <div className="export-menu">
                    <button
                      className="export-menu-item"
                      onClick={() => {
                        handleExportCSV();
                        setShowExportMenu(false);
                      }}
                    >
                      📄 Exportar como CSV
                    </button>
                    <button
                      className="export-menu-item"
                      onClick={() => {
                        handleExportExcel();
                        setShowExportMenu(false);
                      }}
                    >
                      📊 Exportar como Excel
                    </button>
                  </div>
                )}
              </div>
              <button
                className="btn btn-primary"
                onClick={() => setShowFilters(true)}
              >
                🔍 Filtros
              </button>
            </div>
          </div>

          {sortedExpenses.length === 0 ? (
            <EmptyState
              icon="💭"
              title="No se encontraron gastos"
              description={
                allExpenses.length === 0
                  ? 'Todavía no tenés gastos registrados. ¡Agregá el primero!'
                  : 'No hay gastos que coincidan con los filtros aplicados.'
              }
              action={allExpenses.length > 0 && (
                <button className="btn btn-secondary" onClick={clearFilters}>
                  Limpiar filtros
                </button>
              )}
            />
          ) : (
            <div className="expenses-table-wrapper">
              <table className="expenses-table">
                <thead>
                  <tr>
                    <th
                      className={`sortable ${sortBy === 'description' ? `sorted-${sortOrder}` : ''}`}
                      onClick={() => handleSort('description')}
                    >
                      Descripción {sortBy === 'description' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className={`sortable ${sortBy === 'category' ? `sorted-${sortOrder}` : ''}`}
                      onClick={() => handleSort('category')}
                    >
                      Categoría {sortBy === 'category' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className={`sortable ${sortBy === 'amount' ? `sorted-${sortOrder}` : ''}`}
                      onClick={() => handleSort('amount')}
                    >
                      Monto {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className={`sortable ${sortBy === 'date' ? `sorted-${sortOrder}` : ''}`}
                      onClick={() => handleSort('date')}
                    >
                      Fecha {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedExpenses.map((expense, index) => (
                    <tr key={expense.id} style={{ animationDelay: `${index * 0.03}s` }}>
                      <td className="expenses-description">{expense.description}</td>
                      <td>
                        <span className={`category-badge category-${CATEGORY_COLORS[expense.category] || 'default'}`}>
                          {CATEGORY_EMOJIS[expense.category] || '📦'} {expense.category}
                        </span>
                      </td>
                      <td className="expenses-amount">{formatCurrency(expense.amount)}</td>
                      <td className="expenses-date">{formatDate(expense.date)}</td>
                      <td className="expenses-actions">
                        <button
                          className="expenses-action-btn expenses-action-delete"
                          onClick={() => handleDeleteClick(expense)}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleDeleteConfirmed}
        title="Eliminar Gasto"
        message={expenseToDelete ? `¿Estás seguro de eliminar "${expenseToDelete.description}" de ${formatCurrency(expenseToDelete.amount)}? Esta acción no se puede deshacer.` : ''}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        icon="🗑️"
      />
    </div>
  );
}

export default Expenses;
