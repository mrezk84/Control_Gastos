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
  '#10b981', // emerald
  '#f59e0b', // amber
  '#38bdf8', // sky
  '#f472b6', // pink
  '#34d399', // mint
  '#f43f5e', // rose
  '#22d3ee', // cyan
  '#d8b878', // champagne
  '#2dd4bf', // teal
  '#94a3b8', // slate
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
