import { validateLogin } from './authForm';

describe('validación del inicio de sesión', () => {
  test('exige usuario o correo y contraseña, en ese orden', () => {
    expect(validateLogin({ username: '', password: '' }).field).toBe('username');
    expect(validateLogin({ username: '   ', password: 'x' }).field).toBe('username');
    expect(validateLogin({ username: 'ana', password: '' }).field).toBe('password');
  });

  test('acepta usuario o correo y no impone largo a la contraseña (cuentas existentes)', () => {
    expect(validateLogin({ username: 'ana', password: 'abc' })).toBeNull();
    expect(validateLogin({ username: 'ana@example.com', password: 'secreto1' })).toBeNull();
  });
});
