import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../services/api';
import { supabase } from '../services/supabase';

function ResetPassword() {
    // The recovery link from the email signs the user in through Supabase
    const [hasSession, setHasSession] = useState(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setHasSession(!!session);
        });
        return () => listener.subscription.unsubscribe();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!password || password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);
        try {
            await resetPassword(password);
            setSuccess(true);
            setTimeout(() => navigate('/dashboard'), 3000);
        } catch (err) {
            if (err?.code === 'same_password') {
                setError('La nueva contraseña tiene que ser distinta de la anterior.');
            } else if (err?.status === 401 || err?.status === 403) {
                setError('El enlace de recuperación expiró o es inválido. Solicitá uno nuevo.');
            } else {
                setError('Error al restablecer la contraseña. Intentá de nuevo.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (hasSession === null) {
        return (
            <div className="auth-page">
                <div className="animated-bg" />
                <div className="callback-loading">
                    <div className="spinner" />
                    <p>Verificando enlace...</p>
                </div>
            </div>
        );
    }

    if (!hasSession) {
        return (
            <div className="auth-page">
                <div className="animated-bg" />
                <div className="auth-container">
                    <div className="auth-card">
                        <div className="auth-logo">
                            <div className="auth-logo-icon">⚠️</div>
                        </div>
                        <h1 className="auth-title">Enlace Inválido</h1>
                        <p className="auth-subtitle">Este enlace de recuperación no es válido. Solicitá uno nuevo.</p>
                        <p className="auth-link">
                            <Link to="/forgot-password">Solicitar nuevo enlace</Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="animated-bg" />
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-logo">
                        <div className="auth-logo-icon">🔒</div>
                    </div>
                    <h1 className="auth-title">Nueva Contraseña</h1>
                    <p className="auth-subtitle">Ingresá tu nueva contraseña</p>

                    {error && <div className="auth-alert">{error}</div>}
                    {success && (
                        <div className="auth-alert" style={{
                            background: 'rgba(67, 233, 123, 0.12)',
                            borderColor: 'rgba(67, 233, 123, 0.3)',
                            color: 'var(--accent-green)'
                        }}>
                            ✅ ¡Contraseña actualizada! Redirigiendo...
                        </div>
                    )}

                    {!success && (
                        <form onSubmit={handleSubmit}>
                            <div className="form-group-dark">
                                <label htmlFor="new-password">Nueva contraseña</label>
                                <input
                                    id="new-password"
                                    className="input-dark"
                                    type="password"
                                    placeholder="Mínimo 6 caracteres"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="new-password"
                                />
                            </div>
                            <div className="form-group-dark">
                                <label htmlFor="confirm-password">Confirmar contraseña</label>
                                <input
                                    id="confirm-password"
                                    className="input-dark"
                                    type="password"
                                    placeholder="Repetí tu contraseña"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    autoComplete="new-password"
                                />
                            </div>
                            <button className="btn-gradient" type="submit" disabled={loading}>
                                {loading ? 'Actualizando...' : 'Restablecer Contraseña'}
                            </button>
                        </form>
                    )}

                    <p className="auth-link">
                        <Link to="/login">← Volver al login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default ResetPassword;
