import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { resetPassword } from '../services/api';

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

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
        if (!token) {
            setError('Token de recuperación inválido. Solicitá un nuevo enlace.');
            return;
        }

        setLoading(true);
        try {
            await resetPassword(token, password);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            const status = err?.response?.status;
            if (status === 400 || status === 401) {
                setError('El enlace de recuperación expiró o es inválido. Solicitá uno nuevo.');
            } else if (!err?.response) {
                setError('🔌 No se pudo conectar al servidor.');
            } else {
                setError('Error al restablecer la contraseña. Intentá de nuevo.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
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
                            ✅ ¡Contraseña actualizada! Redirigiendo al login...
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
