// Iconos Phosphor por categoría (ver docs/design/tokens.md)
export const CATEGORY_ICON = {
  'Vivienda': 'house',
  'Alimentación': 'fork-knife',
  'Transporte': 'bus',
  'Servicios': 'lightning',
  'Entretenimiento': 'film-slate',
  'Salud': 'first-aid-kit',
  'Educación': 'graduation-cap',
  'Ropa': 't-shirt',
  'Tecnología': 'device-mobile',
  'Otros': 'package',
};

/** Clases CSS del icono de una categoría; las desconocidas usan "package". */
export const categoryIconClass = (name) => `ph-duotone ph-${CATEGORY_ICON[name] || 'package'}`;
