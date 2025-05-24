import React, { useState, useEffect } from 'react';
import { Container, Navbar, Button, Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import ExpenseForm from './ExpenseForm';
import ExpenseList from './ExpenseList';
import { getExpenses } from '../services/api';

ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [refresh, setRefresh] = useState(false);

  const fetchExpenses = async () => {
    try {
      const response = await getExpenses();
      setExpenses(response.data);
    } catch (err) {
      console.error('Error fetching expenses', err);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [refresh]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Calcular datos para el gráfico
  const calculateChartData = () => {
    const categories = ['Alimentos', 'Transporte', 'Entretenimiento', 'Otros'];
    const totals = categories.map((cat) =>
      expenses
        .filter((exp) => exp.category === cat)
        .reduce((sum, exp) => sum + parseFloat(exp.amount), 0)
    );
    return {
      labels: categories,
      datasets: [
        {
          label: 'Gastos por Categoría',
          data: totals,
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // Calcular total de gastos
  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0).toFixed(2);

  return (
    <div>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand>Control de Gastos</Navbar.Brand>
          <Button variant="outline-light" onClick={handleLogout}>
            Cerrar Sesión
          </Button>
        </Container>
      </Navbar>
      <Container className="mt-4">
        <h2>Dashboard</h2>
        <Row className="mb-4">
          <Col md={6}>
            <Card>
              <Card.Body>
                <Card.Title>Gastos por Categoría</Card.Title>
                <Pie data={calculateChartData()} />
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card>
              <Card.Body>
                <Card.Title>Resumen</Card.Title>
                <Card.Text>
                  <strong>Total Gastos:</strong> ${totalExpenses}
                </Card.Text>
                <Card.Text>
                  <strong>Número de Gastos:</strong> {expenses.length}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <ExpenseForm onExpenseAdded={() => setRefresh(!refresh)} />
        <ExpenseList />
      </Container>
    </div>
  );
};

export default Dashboard;