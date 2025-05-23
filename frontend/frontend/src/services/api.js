import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const createExpense = async (expense) => {
  return await axios.post(`${API_URL}/expenses/`, expense);
};

export const getExpenses = async () => {
  return await axios.get(`${API_URL}/expenses/`);
};