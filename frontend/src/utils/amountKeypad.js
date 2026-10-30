// Lógica del teclado numérico del panel "Registrar gasto" (sin React, para poder probarla).

export const MAX_AMOUNT_CHARS = 9;

/**
 * Aplica una tecla al monto, que es una cadena de dígitos (con decimales solo si el gasto
 * editado ya los tenía). '⌫' borra el último carácter; cualquier otra tecla se agrega.
 */
export const pressKey = (prev, key) => {
  if (key === '⌫') return prev.slice(0, -1);
  const next = (prev + key).replace(/^0+(?=\d)/, '');
  if (next.length > MAX_AMOUNT_CHARS || /\.\d{3,}/.test(next)) return prev;
  return next;
};
