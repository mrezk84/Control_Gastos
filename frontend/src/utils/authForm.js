// Validación del formulario de inicio de sesión.

/** { field, message } con el primer problema, o null si los datos están completos. */
export function validateLogin({ username, password }) {
  if (!String(username || '').trim()) return { field: 'username', message: 'Escribe tu usuario o correo' };
  if (!password) return { field: 'password', message: 'Escribe tu contraseña' };
  return null;
}

const EMAIL = /^\S+@\S+\.\S+$/;
export const MIN_PASSWORD = 6;

/** Fuerza de una contraseña: score 0-4 (largo ≥ 8, mayúsculas y minúsculas, número, símbolo) y su etiqueta. */
export function passwordStrength(password) {
  const pw = password || '';
  const score = [pw.length >= 8, /[A-Z]/.test(pw) && /[a-z]/.test(pw), /\d/.test(pw), /[^\w\s]/.test(pw)].filter(Boolean).length;
  const label = pw ? ['MUY DÉBIL', 'DÉBIL', 'MEDIA', 'BUENA', 'FUERTE'][score] : '—';
  return { score, label };
}

/** Primer problema del formulario de registro ({ field, message }) o null. */
export function validateRegister({ name, email, password, confirm }) {
  if (!String(name || '').trim()) return { field: 'name', message: 'Escribe tu nombre' };
  if (!EMAIL.test(String(email || '').trim())) return { field: 'email', message: 'Escribe un correo válido' };
  if (!password || password.length < MIN_PASSWORD) {
    return { field: 'password', message: `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres` };
  }
  if (password !== confirm) return { field: 'confirm', message: 'Las contraseñas no coinciden' };
  return null;
}
