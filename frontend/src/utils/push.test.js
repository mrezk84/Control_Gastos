import { explainPushError } from './push';

const abort = Object.assign(new Error('Registration failed - push service error'), { name: 'AbortError' });

describe('explainPushError', () => {
  test('AbortError al suscribirse en Brave explica cómo activar el servicio de Google', () => {
    const msg = explainPushError('subscribe', abort, true);
    expect(msg).toMatch(/Brave/);
    expect(msg).toMatch(/brave:\/\/settings/);
    expect(msg).toMatch(/Chrome, Edge o Firefox/);
    expect(msg).toMatch(/campana/);
  });

  test('AbortError en otro navegador apunta a conexión, extensiones o VPN', () => {
    expect(explainPushError('subscribe', abort, false)).toMatch(/VPN/);
  });

  test('NotAllowedError pide revisar el permiso del sitio', () => {
    const err = Object.assign(new Error('x'), { name: 'NotAllowedError' });
    expect(explainPushError('subscribe', err)).toMatch(/Permitir/);
  });

  test('errores del servidor: sesión vencida, rechazo, sin conexión, otro', () => {
    expect(explainPushError('server', { response: { status: 401 } })).toMatch(/sesión venció/);
    expect(explainPushError('server', { response: { status: 422 } })).toMatch(/rechazó/);
    expect(explainPushError('server', {})).toMatch(/conectar con el servidor/);
    expect(explainPushError('server', { response: { status: 500 } })).toMatch(/error 500/);
  });

  test('fallo al registrar el service worker', () => {
    expect(explainPushError('register', new Error('x'))).toMatch(/Recarga/);
  });
});
