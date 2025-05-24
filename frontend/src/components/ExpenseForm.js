import React, { useState } from 'react';
import { Form, Button, Container, Alert } from 'react-bootstrap';
import { createExpense } from '../services/api';

const ExpenseForm = ({ onExpenseAdded }) => {
  const [expense, setExpense] = useState({ description: '', amount: '', category: '', date: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!expense.description.trim()) {
      setError('La descripción es obligatoria');
      return;
    }
    if (!expense.amount || parseFloat(expense.amount) <= 0) {
      setError('El monto debe ser mayor que 0');
      return;
    }
    if (!expense.category) {
      setError('Selecciona una categoría');
      return;
    }
    if (!expense.date) {
      setError('La fecha es obligatoria');
      return;
    }

    try {
      await createExpense({ ...expense, amount: parseFloat(expense.amount) });
      onExpenseAdded();
      setExpense({ description: '', amount: '', category: '', date: '' });
    } catch (err) {
      setError('Error al agregar el gasto');
    }
  };

  return (
    <Container className="mb-4">
      <h3>Agregar Gasto</h3>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="description">
          <Form.Label>Descripción</Form.Label>
          <Form.Control
            type="text"
            placeholder="Ej. Comida"
            value={expense.description}
            onChange={(e) => setExpense({ ...expense, description: e.target.value })}
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="amount">
          <Form.Label>Monto</Form.Label>
          <Form.Control
            type="number"
            step="0.01"
            placeholder="Ej. 50.00"
            value={expense.amount}
            onChange={(e) => setExpense({ ...expense, amount: e.target.value })}
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="category">
          <Form.Label>Categoría</Form.Label>
          <Form.Control
            as="select"
            value={expense.category}
            onChange={(e) => setExpense({ ...expense, category: e.target.value })}
          >
            <option value="">Selecciona una categoría</option>
            <option value="Alimentos">Alimentos</option>
            <option value="Transporte">Transporte</option>
            <option value="Entretenimiento">Entretenimiento</option>
            <option value="Otros">Otros</option>
          </Form.Control>
        </Form.Group>
        <Form.Group className="mb-3" controlId="date">
          <Form.Label>Fecha</Form.Label>
          <Form.Control
            type="datetime-local"
            value={expense.date}
            onChange={(e) => setExpense({ ...expense, date: e.target.value })}
          />
        </Form.Group>
        <Button variant="primary" type="submit">
          Agregar
        </Button>
      </Form>
    </Container>
  );
};

export default ExpenseForm;