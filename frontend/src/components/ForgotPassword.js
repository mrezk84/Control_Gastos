import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../services/api';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [resetLink, setResetLink] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setResetLink('');
        if (!email.trim()) {
            setError('Ingresá tu email para recuperar tu contraseña');
            return;
        }
        setLoading(true);
        try {
            const response = await requestPasswordReset(email);
            setSuccess('✅ Se generó un enlace para restablecer tu contraseña.');
            if (response.data.reset_url) {
                setResetLink(response.data.reset_url);
            }
        } catch (err) {
            const status = err?.response?.status;
            if (status === 404) {
                setError('No se encontró una cuenta con ese email.');
            } else if (!err?.response) {
                setError('🔌 No se pudo conectar al servidor. Asegurate de que el backend esté corriendo.');
            } else {
                setError('Error al procesar la solicitud. Intentá de nuevo.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="animated-bg" />
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-logo">
                        <div className="auth-logo-icon">🔑</div>
                    </div>
                    <h1 className="auth-title">Recuperar Contraseña</h1>
                    <p className="auth-subtitle">Ingresá tu email y te generamos un enlace para restablecer tu contraseña</p>

                    {error && <div className="auth-alert">{error}</div>}
                    {success && (
                        <div className="auth-alert" style={{
                            background: 'rgba(67, 233, 123, 0.12)',
                            borderColor: 'rgba(67, 233, 123, 0.3)',
                            color: 'var(--accent-green)'
                        }}>
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group-dark">
                            <label htmlFor="reset-email">Email</label>
                            <input
                                id="reset-email"
                                className="input-dark"
                                type="email"
                                placeholder="tu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                            />
                        </div>
                        <button className="btn-gradient" type="submit" disabled={loading}>
                            {loading ? 'Enviando...' : 'Recuperar Contraseña'}
                        </button>
                    </form>

                    {resetLink && (
                        <div style={{ marginTop: 20, textAlign: 'center' }}>
                            <Link
                                to={resetLink.replace(window.location.origin, '')}
                                style={{
                                    display: 'inline-block',
                                    padding: '12px 24px',
                                    background: 'var(--gradient-accent)',
                                    borderRadius: 'var(--radius-md)',
                                    color: '#0a0a1a',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    textDecoration: 'none',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                }}
                            >
                                🔗 Ir a restablecer contraseña
                            </Link>
                        </div>
                    )}

                    <p className="auth-link">
                        <Link to="/login">← Volver al login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;
