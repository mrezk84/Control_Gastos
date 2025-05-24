import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap'; // Agrega Button aquí
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import ExpenseForm from './ExpenseForm';
import ExpenseList from './ExpenseList';
import { getExpenses } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const response = await getExpenses();
        setExpenses(response.data);
      } catch (err) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    };
    fetchExpenses();
  }, [navigate]);

  const categories = [...new Set(expenses.map((exp) => exp.category))];
  const chartData = {
    labels: categories,
    datasets: [
      {
        label: 'Gastos por Categoría',
        data: categories.map((cat) =>
          expenses.filter((exp) => exp.category === cat).reduce((sum, exp) => sum + exp.amount, 0)
        ),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  return (
    <Container className="mt-5">
      <h2>Dashboard</h2>
      <Row>
        <Col md={6}>
          <ExpenseForm setExpenses={setExpenses} />
        </Col>
        <Col md={6}>
          <Bar data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
        </Col>
      </Row>
      <ExpenseList expenses={expenses} setExpenses={setExpenses} />
      <Button variant="danger" onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}>
        Cerrar Sesión
      </Button>
    </Container>
  );
}

export default Dashboard;