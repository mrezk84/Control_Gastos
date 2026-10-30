import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setAuthToken } from '../services/api';

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
        } else {
            setError('No se recibió un token válido. Intentá de nuevo.');
            setTimeout(() => navigate('/login', { replace: true }), 3000);
        }
    }, [searchParams, navigate]);

    return (
        <div className="auth-page">
            <div className="animated-bg" />
            <div className="callback-loading">
                {error ? (
                    <>
                        <div style={{ fontSize: '48px' }}>⚠️</div>
                        <p style={{ color: 'var(--accent-red)' }}>{error}</p>
                        <p>Redirigiendo al login...</p>
                    </>
                ) : (
                    <>
                        <div className="spinner" />
                        <p>Autenticando...</p>
                    </>
                )}
            </div>
        </div>
    );
}

export default OAuthCallback;
