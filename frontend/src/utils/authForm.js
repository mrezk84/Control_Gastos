// Validación del formulario de inicio de sesión.

/** { field, message } con el primer problema, o null si los datos están completos. */
export function validateLogin({ username, password }) {
  if (!String(username || '').trim()) return { field: 'username', message: 'Escribe tu usuario o correo' };
  if (!password) return { field: 'password', message: 'Escribe tu contraseña' };
  return null;
}
