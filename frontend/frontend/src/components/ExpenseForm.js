import React, { useState } from 'react';
import { createExpense } from '../services/api';

const ExpenseForm = ({ onExpenseAdded }) => {
  const [expense, setExpense] = useState({ description: '', amount: '', category: '', date: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createExpense(expense);
    onExpenseAdded();
    setExpense({ description: '', amount: '', category: '', date: '' });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={expense.description}
        onChange={(e) => setExpense({ ...expense, description: e.target.value })}
        placeholder="Descripción"
      />
      <input
        type="number"
        value={expense.amount}
        onChange={(e) => setExpense({ ...expense, amount: e.target.value })}
        placeholder="Monto"
      />
      <input
        type="text"
        value={expense.category}
        onChange={(e) => setExpense({ ...expense, category: e.target.value })}
        placeholder="Categoría"
      />
      <input
        type="datetime-local"
        value={expense.date}
        onChange={(e) => setExpense({ ...expense, date: e.target.value })}
      />
      <button type="submit">Agregar Gasto</button>
    </form>
  );
};

export default ExpenseForm;