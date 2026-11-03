import { classifyScan, daysUntil, dueText, shortDate, todayISO } from './scanFlow';
import { linkFor, parseUtc, timeAgo } from './notifications';
import { urlBase64ToUint8Array } from './push';
import { detectRegional, missingRegional } from './regional';
import { decodeQrFromImageData } from './qrFromImage';
import { QR_ROWS, QR_TEXT } from './__fixtures__/qrCfe';

describe('pagada o pendiente', () => {
  test('vencimiento posterior a hoy = pendiente; el resto = pagada', () => {
    expect(classifyScan('2026-11-15', '2026-11-03')).toBe('pending');
    expect(classifyScan('2026-11-03', '2026-11-03')).toBe('paid');
    expect(classifyScan('2026-11-01', '2026-11-03')).toBe('paid');
    expect(classifyScan(null, '2026-11-03')).toBe('paid');
    expect(classifyScan('15/11/2026', '2026-11-03')).toBe('paid');
  });

  test('días que faltan y su texto', () => {
    expect(daysUntil('2026-11-06', '2026-11-03')).toBe(3);
    expect(daysUntil('2026-11-03', '2026-11-03')).toBe(0);
    expect(daysUntil('2026-10-31', '2026-11-03')).toBe(-3);
    expect(daysUntil('2026-12-01', '2026-11-30')).toBe(1); // cambio de mes
    expect(dueText(0)).toBe('vence hoy');
    expect(dueText(1)).toBe('vence mañana');
    expect(dueText(3)).toBe('vence en 3 días');
    expect(dueText(-1)).toBe('venció ayer');
    expect(dueText(-4)).toBe('venció hace 4 días');
  });

  test('fecha corta y hoy local', () => {
    expect(shortDate('2026-11-15')).toBe('15/11');
    expect(shortDate('')).toBe('');
    expect(todayISO(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('notificaciones', () => {
  test('las fechas sin zona del servidor se leen como UTC', () => {
    expect(parseUtc('2026-11-03T15:00:00').toISOString()).toBe('2026-11-03T15:00:00.000Z');
    expect(parseUtc('2026-11-03T15:00:00Z').toISOString()).toBe('2026-11-03T15:00:00.000Z');
    expect(parseUtc(null)).toBeNull();
  });

  test('hace cuánto', () => {
    const now = Date.parse('2026-11-03T15:00:00Z');
    expect(timeAgo('2026-11-03T14:59:30', now)).toBe('ahora');
    expect(timeAgo('2026-11-03T14:55:00', now)).toBe('hace 5 min');
    expect(timeAgo('2026-11-03T12:00:00', now)).toBe('hace 3 h');
    expect(timeAgo('2026-11-01T15:00:00', now)).toBe('hace 2 d');
    expect(timeAgo('basura', now)).toBe('');
  });

  test('los avisos del servidor apuntan a rutas que existen', () => {
    expect(linkFor('/')).toBe('/dashboard');
    expect(linkFor(null)).toBe('/dashboard');
    expect(linkFor('/expenses')).toBe('/expenses');
  });
});

describe('web push', () => {
  test('clave VAPID base64 url-safe → bytes', () => {
    // "BPk-_w" en base64 url-safe = bytes 04 f9 3e ff
    expect(Array.from(urlBase64ToUint8Array('BPk-_w'))).toEqual([4, 249, 62, 255]);
  });
});

describe('perfil regional', () => {
  test('se deduce del huso horario y del idioma', () => {
    expect(detectRegional({ timezone: 'America/Montevideo', locale: 'es-AR' })).toEqual({
      country: 'UY', currency: 'UYU', timezone: 'America/Montevideo',
    });
    expect(detectRegional({ timezone: 'Asia/Tokyo', locale: 'es-CL' })).toEqual({
      country: 'CL', currency: 'CLP', timezone: 'Asia/Tokyo',
    });
    expect(detectRegional({ timezone: 'Asia/Tokyo', locale: 'ja' })).toEqual({ timezone: 'Asia/Tokyo' });
  });

  test('solo se envían los campos que faltan: no se pisa lo que la persona ya eligió', () => {
    const env = { timezone: 'America/Montevideo', locale: 'es-UY' };
    expect(missingRegional({ currency: 'USD' }, env)).toEqual({ country: 'UY', timezone: 'America/Montevideo' });
    expect(missingRegional({ country: 'AR', currency: 'ARS', timezone: 'America/Argentina/Buenos_Aires' }, env)).toEqual({});
  });
});

describe('lectura de QR', () => {
  // Dibuja el QR de prueba (41 módulos) con 6 px por módulo y un margen blanco de 4 módulos
  function render(scale = 6, quiet = 4) {
    const n = QR_ROWS.length;
    const size = (n + quiet * 2) * scale;
    const data = new Uint8ClampedArray(size * size * 4).fill(255);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (QR_ROWS[y][x] !== '1') continue;
        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            const i = (((y + quiet) * scale + dy) * size + (x + quiet) * scale + dx) * 4;
            data[i] = data[i + 1] = data[i + 2] = 0;
          }
        }
      }
    }
    return { data, size };
  }

  test('lee el texto de un QR real', () => {
    const { data, size } = render();
    expect(decodeQrFromImageData(data, size, size)).toBe(QR_TEXT);
  });

  test('una imagen sin QR da null', () => {
    const blank = new Uint8ClampedArray(200 * 200 * 4).fill(255);
    expect(decodeQrFromImageData(blank, 200, 200)).toBeNull();
  });
});
