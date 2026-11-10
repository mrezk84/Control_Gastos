// Categorías de gastos - configuración centralizada

export const CATEGORY_EMOJIS = {
  'Alimentación': '🍔',
  'Transporte': '🚗',
  'Entretenimiento': '🎬',
  'Salud': '💊',
  'Servicios': '💡',
  'Educación': '📚',
  'Vivienda': '🏠',
  'Ropa': '👕',
  'Tecnología': '💻',
  'Otros': '📦',
};

export const CATEGORY_COLORS = {
  'Alimentación': 'orange',
  'Transporte': 'blue',
  'Entretenimiento': 'pink',
  'Salud': 'green',
  'Servicios': 'red',
  'Educación': 'green',
  'Vivienda': 'cyan',
  'Ropa': 'yellow',
  'Tecnología': 'blue',
  'Otros': 'gray',
};

export const CATEGORIES = Object.keys(CATEGORY_EMOJIS);

// Colores para gráficos
// Misma rampa que --cat-1…6 de caja.css (paleta "Tinta + Lima"): se distinguen por luminosidad
export const CHART_COLORS = [
  '#d7f54a', // lima
  '#aed23c',
  '#86b03a',
  '#5f8d3c',
  '#62d9b3', // menta
  '#7cc4ff', // cielo
  '#f5c451', // aviso
  '#ff7b72', // coral
  '#6b7482', // gris
  '#eef1f5', // texto
];

// Configuración de fecha
export const DATE_CONFIG = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
};
