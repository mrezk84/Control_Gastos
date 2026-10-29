import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { completeOAuthLogin } from '../services/api';

function OAuthCallback() {
    const [searchParams] = useSearchParams();
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fail = (message) => {
            setError(message);
            setTimeout(() => navigate('/login', { replace: true }), 3000);
        };

        const providerError = searchParams.get('error_description') || searchParams.get('error');
        if (providerError) {
            fail(`No se pudo iniciar sesión: ${providerError}`);
            return;
        }

        completeOAuthLogin()
            .then((session) => {
                if (session) {
                    navigate('/dashboard', { replace: true });
                } else {
                    fail('No se recibió una sesión válida. Intentá de nuevo.');
                }
            })
            .catch(() => fail('No se recibió una sesión válida. Intentá de nuevo.'));
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
