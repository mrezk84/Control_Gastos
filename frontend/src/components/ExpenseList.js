import React from 'react';

const CATEGORY_CLASSES = {
  'Alimentación': 'food',
  'Transporte': 'transport',
  'Entretenimiento': 'entertainment',
  'Salud': 'health',
  'Servicios': 'services',
};

function ExpenseList({ expenses }) {
  const formatCurrency = (val) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (!expenses.length) {
    return (
      <div className="expense-table-card">
        <div className="expense-table-title">📋 Últimos Gastos</div>
        <div className="empty-state">
          <div className="empty-state-icon">💭</div>
          <p>Todavía no tenés gastos registrados. ¡Agregá el primero!</p>
        </div>
      </div>
    );
  }

  // Show most recent first
  const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="expense-table-card">
      <div className="expense-table-title">📋 Últimos Gastos ({expenses.length})</div>
      <table className="expense-table">
        <thead>
          <tr>
            <th>Descripción</th>
            <th>Monto</th>
            <th>Categoría</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((expense, index) => (
            <tr key={expense.id} style={{ animationDelay: `${index * 0.05}s` }}>
              <td>{expense.description}</td>
              <td className="amount-cell">{formatCurrency(expense.amount)}</td>
              <td>
                <span className={`category-badge ${CATEGORY_CLASSES[expense.category] || ''}`}>
                  {expense.category}
                </span>
              </td>
              <td className="date-cell">{formatDate(expense.date)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ExpenseList;