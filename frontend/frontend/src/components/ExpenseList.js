import React, { useEffect, useState } from 'react';
import { getExpenses } from '../services/api';

const ExpenseList = () => {
  const [expenses, setExpenses] = useState([]);

  const fetchExpenses = async () => {
    const response = await getExpenses();
    setExpenses(response.data);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  return (
    <ul>
      {expenses.map((exp) => (
        <li key={exp.id}>
          {exp.description} - {exp.amount} - {exp.category} - {exp.date}
        </li>
      ))}
    </ul>
  );
};

export default ExpenseList;