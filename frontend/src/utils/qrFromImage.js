// Lectura de códigos QR en fotos (imagen → texto del QR) con jsQR. No es lectura en vivo por vídeo.
import jsQR from 'jsqr';

const SIZES = [1600, 900]; // un QR pequeño en una foto grande a veces se lee mejor reducido

/** Texto del QR contenido en unos píxeles RGBA, o null si no hay ninguno legible. */
export function decodeQrFromImageData(data, width, height) {
  const result = jsQR(data, width, height, { inversionAttempts: 'attemptBoth' });
  return result?.data || null;
}

async function loadBitmap(file) {
  if (typeof createImageBitmap === 'function') return createImageBitmap(file);
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Busca un QR en una imagen subida o fotografiada. Devuelve su texto o null (también para PDFs y errores). */
export async function decodeQrFromFile(file) {
  if (!file || !String(file.type).startsWith('image/')) return null;
  try {
    const bitmap = await loadBitmap(file);
    const w0 = bitmap.width || bitmap.naturalWidth;
    const h0 = bitmap.height || bitmap.naturalHeight;
    for (const max of SIZES) {
      const scale = Math.min(1, max / Math.max(w0, h0));
      const w = Math.max(1, Math.round(w0 * scale));
      const h = Math.max(1, Math.round(h0 * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(bitmap, 0, 0, w, h);
      const text = decodeQrFromImageData(ctx.getImageData(0, 0, w, h).data, w, h);
      if (text) return text;
    }
    return null;
  } catch {
    return null;
  }
}
