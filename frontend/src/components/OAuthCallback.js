import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { setAuthToken } from '../services/api';
import AuthShell from './auth/AuthShell';

/** Retorno del acceso con Google o Microsoft: guarda el token y entra, o vuelve al login con un aviso. */
function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setAuthToken(token);
      localStorage.setItem('token', token);
      navigate('/dashboard', { replace: true });
      return undefined;
    }
    setError('No recibimos una respuesta válida del proveedor. Inténtalo de nuevo.');
    const id = setTimeout(() => navigate('/login', { replace: true }), 3000);
    return () => clearTimeout(id);
  }, [searchParams, navigate]);

  return (
    <AuthShell>
      <div className="cj-login-form">
        {error ? (
          <>
            <div className="cj-login-head">
              <h1>No pudimos iniciar tu sesión</h1>
            </div>
            <div className="cj-login-error" role="alert">
              <i className="ph ph-warning" aria-hidden="true" />
              <span>{error}</span>
            </div>
            <p className="cj-login-alt">
              <Link to="/login"><i className="ph ph-arrow-left" aria-hidden="true" />Volver a iniciar sesión</Link>
            </p>
          </>
        ) : (
          <div className="cj-login-head" role="status">
            <h1>Entrando…</h1>
            <p className="cj-login-lede">Estamos verificando tu cuenta.</p>
          </div>
        )}
      </div>
    </AuthShell>
  );
}

export default OAuthCallback;
