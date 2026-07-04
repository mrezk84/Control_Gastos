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
export const CHART_COLORS = [
  '#43e97b', // green
  '#38f9d7', // teal
  '#2fe8a0', // mint
  '#7dffb0', // light green
  '#fbbf24', // amber
  '#f5576c', // rose
  '#38bdf8', // sky
  '#a0a0c0', // gray
  '#c9ff5c', // lime
  '#f0f0ff', // white
];

// Configuración de moneda
export const CURRENCY_CONFIG = {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
};

// Configuración de fecha
export const DATE_CONFIG = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
};
