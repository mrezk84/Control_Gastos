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

describe('fuerza de la contraseña', () => {
  const { passwordStrength } = require('./authForm');

  test('puntúa largo, mayúsculas y minúsculas, número y símbolo', () => {
    expect(passwordStrength('')).toEqual({ score: 0, label: '—' });
    expect(passwordStrength('abc')).toEqual({ score: 0, label: 'MUY DÉBIL' });
    expect(passwordStrength('abcdefgh').score).toBe(1);
    expect(passwordStrength('abcdefG1').score).toBe(3);
    expect(passwordStrength('abcdefG1!')).toEqual({ score: 4, label: 'FUERTE' });
  });
});

describe('validación del registro', () => {
  const { validateRegister } = require('./authForm');
  const ok = { name: 'Martina', email: 'martina@correo.com', password: 'secreto1', confirm: 'secreto1' };

  test('datos válidos', () => {
    expect(validateRegister(ok)).toBeNull();
  });

  test('orden de los problemas: nombre, correo, largo, coincidencia', () => {
    expect(validateRegister({ ...ok, name: '  ' }).field).toBe('name');
    expect(validateRegister({ ...ok, email: 'no-es-correo' }).field).toBe('email');
    expect(validateRegister({ ...ok, password: 'abc', confirm: 'abc' }).field).toBe('password');
    expect(validateRegister({ ...ok, password: 'abcdefg', confirm: 'abcdefg' }).field).toBe('password'); // 7 < 8
    expect(validateRegister({ ...ok, confirm: 'otra' })).toEqual({ field: 'confirm', message: 'Las contraseñas no coinciden' });
  });
});
