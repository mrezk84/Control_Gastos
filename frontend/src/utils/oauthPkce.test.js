import { base64url, takeOAuthVerifier } from './oauthPkce';

describe('base64url', () => {
  test('usa el alfabeto seguro para URL y sin relleno', () => {
    expect(base64url(new Uint8Array([251, 255, 190]))).toBe('-_--');
    expect(base64url(new Uint8Array([102, 111]))).toBe('Zm8');
  });

  test('32 bytes dan 43 caracteres (el tamaño que valida el backend)', () => {
    expect(base64url(new Uint8Array(32)).length).toBe(43);
  });
});

describe('takeOAuthVerifier', () => {
  test('devuelve el verificador una sola vez', () => {
    sessionStorage.setItem('oauth_verifier', 'abc');
    expect(takeOAuthVerifier()).toBe('abc');
    expect(takeOAuthVerifier()).toBeNull();
  });
});
