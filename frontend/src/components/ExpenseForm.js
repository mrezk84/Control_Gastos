import React, { useState } from 'react';
import { Form, Button, Container } from 'react-bootstrap';
import { createExpense } from '../services/api';

function ExpenseForm({ setExpenses }) {
  const [expense, setExpense] = useState({ description: '', amount: '', category: '', date: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await createExpense({ ...expense, amount: parseFloat(expense.amount) });
      setExpenses((prev) => [...prev, response.data]);
      setExpense({ description: '', amount: '', category: '', date: '' });
    } catch (err) {
      console.error('Error al crear gasto');
    }
  };

  return (
    <Container className="mb-4">
      <h3>Agregar Gasto</h3>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="description">
          <Form.Label>Descripción</Form.Label>
          <Form.Control
            type="text"
            placeholder="Ingresa la descripción"
            value={expense.description}
            onChange={(e) => setExpense({ ...expense, description: e.target.value })}
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="amount">
          <Form.Label>Monto</Form.Label>
          <Form.Control
            type="number"
            placeholder="Ingresa el monto"
            value={expense.amount}
            onChange={(e) => setExpense({ ...expense, amount: e.target.value })}
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="category">
          <Form.Label>Categoría</Form.Label>
          <Form.Control
            type="text"
            placeholder="Ingresa la categoría"
            value={expense.category}
            onChange={(e) => setExpense({ ...expense, category: e.target.value })}
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="date">
          <Form.Label>Fecha</Form.Label>
          <Form.Control
            type="date"
            value={expense.date}
            onChange={(e) => setExpense({ ...expense, date: e.target.value })}
          />
        </Form.Group>
        <Button variant="primary" type="submit">
          Agregar Gasto
        </Button>
      </Form>
    </Container>
  );
}

export default ExpenseForm;