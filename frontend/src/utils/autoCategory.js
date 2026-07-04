// Lightweight keyword-based category suggestion (heuristic, not ML).
// Used to prefill the category field as the user types a description —
// they can always override the suggestion manually.

const KEYWORD_MAP = {
  Alimentación: ['super', 'supermercado', 'resto', 'restaurant', 'almuerzo', 'cena', 'comida', 'delivery', 'pedidosya', 'rappi', 'panaderia', 'panadería', 'verduleria', 'verdulería', 'carniceria', 'carnicería', 'cafe', 'café'],
  Transporte: ['nafta', 'combustible', 'uber', 'cabify', 'taxi', 'remis', 'subte', 'colectivo', 'tren', 'peaje', 'estacionamiento', 'sube'],
  Entretenimiento: ['netflix', 'spotify', 'cine', 'teatro', 'disney', 'hbo', 'youtube', 'juego', 'juegos', 'streaming', 'bar', 'fiesta'],
  Salud: ['farmacia', 'medico', 'médico', 'doctor', 'dentista', 'hospital', 'clinica', 'clínica', 'obra social', 'remedio', 'medicamento'],
  Servicios: ['luz', 'gas', 'agua', 'internet', 'telefono', 'teléfono', 'wifi', 'cable', 'expensas'],
  Educación: ['curso', 'universidad', 'colegio', 'escuela', 'libro', 'libros', 'matricula', 'matrícula'],
  Vivienda: ['alquiler', 'renta', 'hipoteca', 'muebles', 'ferreteria', 'ferretería'],
  Ropa: ['ropa', 'zapatillas', 'zapatos', 'remera', 'pantalon', 'pantalón', 'campera'],
  Tecnología: ['celular', 'notebook', 'computadora', 'auriculares', 'cargador', 'software', 'app store', 'play store'],
};

/**
 * Returns the best-matching category for a free-text description, or null
 * if nothing matches confidently enough to suggest.
 */
export function suggestCategory(description) {
  if (!description || description.trim().length < 3) return null;

  const text = description.toLowerCase();
  for (const [category, keywords] of Object.entries(KEYWORD_MAP)) {
    if (keywords.some((kw) => text.includes(kw))) {
      return category;
    }
  }
  return null;
}
