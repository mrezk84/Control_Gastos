import React from 'react';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';

function App() {
  const [refresh, setRefresh] = React.useState(false);

  return (
    <div>
      <h1>Control de Gastos</h1>
      <ExpenseForm onExpenseAdded={() => setRefresh(!refresh)} />
      <ExpenseList key={refresh} />
    </div>
  );
}

export default App;