// Perfil regional por defecto (país, moneda, huso horario) a partir del navegador. Solo rellena lo que falta.

const TZ_COUNTRY = {
  'America/Montevideo': 'UY', 'America/Argentina/Buenos_Aires': 'AR', 'America/Buenos_Aires': 'AR',
  'America/Santiago': 'CL', 'America/Bogota': 'CO', 'America/Lima': 'PE', 'America/Mexico_City': 'MX',
  'America/Sao_Paulo': 'BR', 'America/Asuncion': 'PY', 'America/La_Paz': 'BO', 'America/Caracas': 'VE',
  'America/Guayaquil': 'EC', 'Europe/Madrid': 'ES', 'Europe/Lisbon': 'PT', 'Europe/Paris': 'FR',
  'Europe/Berlin': 'DE', 'Europe/Rome': 'IT', 'Europe/London': 'GB',
  'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US', 'America/Los_Angeles': 'US',
};

const COUNTRY_CURRENCY = {
  UY: 'UYU', AR: 'ARS', CL: 'CLP', CO: 'COP', PE: 'PEN', MX: 'MXN', BR: 'BRL', PY: 'PYG', BO: 'BOB',
  VE: 'VES', EC: 'USD', US: 'USD', ES: 'EUR', PT: 'EUR', FR: 'EUR', DE: 'EUR', IT: 'EUR', GB: 'GBP',
};

/** { country, currency, timezone } con solo los valores que se pudieron deducir. */
export function detectRegional(env = {}) {
  const timezone = env.timezone ?? safe(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  const locale = env.locale ?? (typeof navigator !== 'undefined' ? navigator.language : '');
  const region = /^[a-z]{2,3}[-_]([A-Za-z]{2})\b/.exec(locale || '')?.[1]?.toUpperCase();
  const country = TZ_COUNTRY[timezone] || region || null;
  const currency = (country && COUNTRY_CURRENCY[country]) || null;
  return Object.fromEntries(Object.entries({ country, currency, timezone }).filter(([, v]) => v));
}

/** Lo que hay que enviar al perfil: lo detectado, pero solo para los campos que la persona aún no tiene. */
export function missingRegional(user, env) {
  const detected = detectRegional(env);
  return Object.fromEntries(Object.entries(detected).filter(([key]) => !user?.[key]));
}

function safe(fn) {
  try {
    return fn();
  } catch {
    return undefined;
  }
}
