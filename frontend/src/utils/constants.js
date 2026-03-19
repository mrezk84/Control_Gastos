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
  'Educación': 'purple',
  'Vivienda': 'cyan',
  'Ropa': 'yellow',
  'Tecnología': 'indigo',
  'Otros': 'gray',
};

export const CATEGORIES = Object.keys(CATEGORY_EMOJIS);

// Colores para gráficos
export const CHART_COLORS = [
  '#8b5cf6', // purple
  '#f97316', // orange
  '#3b82f6', // blue
  '#ec4899', // pink
  '#22c55e', // green
  '#ef4444', // red
  '#06b6d4', // cyan
  '#eab308', // yellow
  '#6366f1', // indigo
  '#6b7280', // gray
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
