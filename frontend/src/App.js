import React, { useEffect } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import OAuthCallback from './components/OAuthCallback';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import SidebarLayout from './components/Layout/SidebarLayout';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Budgets from './pages/Budgets';
import Analytics from './pages/Analytics';
import { setAuthToken } from './services/api';
import ToastProvider from './components/ui/ToastContainer';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

function App() {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) setAuthToken(token);
  }, []);

  return (
    <ToastProvider>
      <BrowserRouter>
        <a href="#main-content" className="skip-link">
          Saltar al contenido principal
        </a>
        <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/oauth-callback" element={<OAuthCallback />} />

        {/* Protected Routes with Sidebar Layout */}
        <Route path="/" element={
          <ProtectedRoute>
            <SidebarLayout>
              <Navigate to="/dashboard" replace />
            </SidebarLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <SidebarLayout>
              <Dashboard />
            </SidebarLayout>
          </ProtectedRoute>
        } />
        <Route path="/expenses" element={
          <ProtectedRoute>
            <SidebarLayout>
              <Expenses />
            </SidebarLayout>
          </ProtectedRoute>
        } />
        <Route path="/budgets" element={
          <ProtectedRoute>
            <SidebarLayout>
              <Budgets />
            </SidebarLayout>
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute>
            <SidebarLayout>
              <Analytics />
            </SidebarLayout>
          </ProtectedRoute>
        } />

        {/* Catch all - redirect to dashboard or login */}
        <Route path="*" element={
          <ProtectedRoute>
            <Navigate to="/dashboard" replace />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
