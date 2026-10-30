import { pressKey, MAX_AMOUNT_CHARS } from './amountKeypad';

const press = (keys, start = '') => keys.reduce((acc, k) => pressKey(acc, k), start);

describe('pressKey', () => {
  test('arma el monto dígito a dígito', () => {
    expect(press(['2', '5', '0', '0', '0'])).toBe('25000');
  });

  test('la tecla 000 agrega tres ceros', () => {
    expect(press(['2', '5', '000'])).toBe('25000');
  });

  test('no acepta ceros a la izquierda', () => {
    expect(press(['0', '0', '5'])).toBe('5');
    expect(press(['000'])).toBe('0');
  });

  test('⌫ borra el último carácter y no falla con el monto vacío', () => {
    expect(press(['1', '2', '3', '⌫'])).toBe('12');
    expect(press(['⌫'])).toBe('');
  });

  test('respeta el máximo de caracteres', () => {
    const lleno = '9'.repeat(MAX_AMOUNT_CHARS);
    expect(pressKey(lleno, '1')).toBe(lleno);
    expect(pressKey(lleno, '000')).toBe(lleno);
  });

  test('un gasto editado con decimales admite hasta dos', () => {
    expect(pressKey('123.4', '5')).toBe('123.45');
    expect(pressKey('123.45', '6')).toBe('123.45');
  });
});
