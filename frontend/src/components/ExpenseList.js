import React from 'react';
import { Table, Container } from 'react-bootstrap';

function ExpenseList({ expenses }) {
  return (
    <Container className="mt-4">
      <h3>Lista de Gastos</h3>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Descripción</th>
            <th>Monto</th>
            <th>Categoría</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr key={expense.id}>
              <td>{expense.description}</td>
              <td>{expense.amount}</td>
              <td>{expense.category}</td>
              <td>{new Date(expense.date).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
}

export default ExpenseList;