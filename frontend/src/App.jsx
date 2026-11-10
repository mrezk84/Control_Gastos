import React, { useEffect } from 'react';
import { BrowserRouter, Route, Routes, Navigate, Outlet } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Budgets from './pages/Budgets';
import Analytics from './pages/Analytics';
import Hormiga from './pages/Hormiga';
import OAuthCallback from './components/OAuthCallback';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import AppLayout from './components/Layout/AppLayout';
import { PageTransition } from './components/ui/PageTransition';
import { ToastProvider } from './components/ui/ToastContainer';
import { setAuthToken } from './services/api';

/** Marco de las pantallas con sesión: se monta una sola vez, así que cambiar de página no recarga el usuario ni los gastos. */
function ProtectedLayout() {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

/** Pantallas de acceso: solo la transición de entrada. */
function PublicLayout() {
  return (
    <PageTransition>
      <Outlet />
    </PageTransition>
  );
}

function App() {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
    }
  }, []);

  return (
    <ToastProvider>
      <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/oauth-callback" element={<OAuthCallback />} />
        </Route>
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/hormiga" element={<Hormiga />} />
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
