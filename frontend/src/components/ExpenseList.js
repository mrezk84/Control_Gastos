import React, { useEffect, useState } from 'react';
import { Table, Container, Form, Row, Col } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import { getExpenses } from '../services/api';

const ExpenseList = () => {
  const [expenses, setExpenses] = useState([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

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
  }, []);

  const filteredExpenses = expenses.filter((exp) => {
    const expDate = new Date(exp.date);
    const matchesCategory = filterCategory ? exp.category === filterCategory : true;
    const matchesDate =
      (!startDate || expDate >= startDate) && (!endDate || expDate <= endDate);
    return matchesCategory && matchesDate;
  });

  return (
    <Container>
      <h3>Lista de Gastos</h3>
      <Row className="mb-3">
        <Col md={4}>
          <Form.Group>
            <Form.Label>Filtrar por Categoría</Form.Label>
            <Form.Control
              as="select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">Todas</option>
              <option value="Alimentos">Alimentos</option>
              <option value="Transporte">Transporte</option>
              <option value="Entretenimiento">Entretenimiento</option>
              <option value="Otros">Otros</option>
            </Form.Control>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Fecha Inicio</Form.Label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              className="form-control"
              placeholderText="Selecciona fecha inicio"
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Fecha Fin</Form.Label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              className="form-control"
              placeholderText="Selecciona fecha fin"
            />
          </Form.Group>
        </Col>
      </Row>
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
          {filteredExpenses.map((exp) => (
            <tr key={exp.id}>
              <td>{exp.description}</td>
              <td>${parseFloat(exp.amount).toFixed(2)}</td>
              <td>{exp.category}</td>
              <td>{new Date(exp.date).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default ExpenseList;