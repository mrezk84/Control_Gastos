// Asistente de ayuda de la app: base de conocimiento local, sin servidor ni modelo.
// Cada tema tiene palabras clave; la pregunta se compara contra ellas (sin tildes ni mayúsculas).

/** 'Cómo registro…' → 'como registro…': sin tildes, en minúsculas y sin espacios sobrantes. */
const normalize = (text) => String(text || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const TOPICS = [
  {
    id: 'registrar',
    title: 'Registrar un gasto',
    keywords: ['registr', 'agreg', 'anad', 'cargar', 'carga', 'nuevo gasto', 'crear gasto', 'apunt', 'anot', 'monto'],
    text: 'Se registra desde el panel de la derecha del Panel:',
    steps: [
      'Escribe el monto con el teclado numérico.',
      'Escribe en qué gastaste: la categoría se sugiere sola, y puedes cambiarla.',
      'Revisa la fecha y toca Registrar.',
    ],
    extra: 'En otras pantallas, Cmd/Ctrl + N abre un gasto rápido.',
    to: '/dashboard', label: 'Ir al Panel',
  },
  {
    id: 'escanear',
    title: 'Escanear un recibo',
    keywords: ['escane', 'recibo', 'factura', 'foto', 'qr', 'ocr', 'camara', 'ticket'],
    text: 'El botón Escanear, arriba del teclado, lee un código QR o la foto de un recibo:',
    steps: [
      'Toca Escanear y elige la imagen (QR o foto del recibo).',
      'La app completa monto, fecha y descripción. Revísalos antes de registrar.',
      'Si la factura trae fecha de vencimiento, se crea un recordatorio de pago.',
    ],
    extra: 'Si el monto está en otra moneda que la tuya, te lo aviso para que lo revises.',
    to: '/dashboard', label: 'Ir al Panel',
  },
  {
    id: 'editar',
    title: 'Editar o borrar un gasto',
    keywords: ['edit', 'modific', 'cambiar gasto', 'corregi', 'borr', 'elimin', 'quitar gasto', 'error al cargar', 'me equivoque'],
    text: 'Puedes corregir o borrar cualquier gasto:',
    steps: [
      'En el Panel, busca el gasto en el Historial y toca el lápiz para editarlo, o la papelera para borrarlo.',
      'En Gastos, la papelera de cada fila lo elimina. Antes te pido confirmación.',
    ],
    to: '/expenses', label: 'Ir a Gastos',
  },
  {
    id: 'importar',
    title: 'Importar y exportar gastos',
    keywords: ['import', 'export', 'csv', 'excel', 'xlsx', 'descargar', 'planilla', 'otra app', 'migrar', 'traer mis datos', 'respaldo'],
    text: 'En Gastos están Importar y Exportar:',
    steps: [
      'Importar: sube un archivo CSV con fecha, descripción, categoría y monto.',
      'Exportar: elige CSV o Excel. Se exporta lo que tengas filtrado.',
    ],
    extra: 'Si viene de otra app, exporta desde allí a CSV y súbelo aquí.',
    to: '/expenses', label: 'Ir a Gastos',
  },
  {
    id: 'filtros',
    title: 'Buscar y filtrar gastos',
    keywords: ['filtr', 'busc', 'busqueda', 'encontrar', 'periodo', 'fecha desde', 'categoria'],
    text: 'En Gastos tienes filtros a la izquierda:',
    steps: [
      'Busca por descripción.',
      'Elige un período: hoy, esta semana, este mes o un rango de fechas.',
      'Marca una o varias categorías.',
    ],
    extra: 'Con Ocultar filtros ganas espacio para la tabla.',
    to: '/expenses', label: 'Ir a Gastos',
  },
  {
    id: 'presupuesto',
    title: 'Crear un presupuesto',
    keywords: ['presupuesto', 'presupuestos', 'limite por categoria', 'tope por categoria', 'cuanto me queda', 'excedi'],
    text: 'Un presupuesto es un tope mensual para una categoría:',
    steps: [
      'Entra a Presupuestos y toca Nuevo Presupuesto.',
      'Elige la categoría y el monto del mes.',
      'La app muestra cuánto llevas gastado y cuánto te queda, y te avisa si lo excedes.',
    ],
    to: '/budgets', label: 'Ir a Presupuestos',
  },
  {
    id: 'saldo',
    title: 'Saldo del mes (semáforo)',
    keywords: ['saldo', 'semaforo', 'limite del mes', 'cuanto puedo gastar', 'tope del mes', 'aviso al 80'],
    text: 'El saldo del mes es lo máximo que quieres gastar este mes:',
    steps: [
      'En el Panel, escribe tu monto en el campo "Saldo del mes".',
      'El semáforo se pone en verde, ámbar o rojo según cuánto llevas.',
      'Desde el 80 % pasa a "cerca del límite".',
    ],
    to: '/dashboard', label: 'Ir al Panel',
  },
  {
    id: 'recordatorios',
    title: 'Pagos pendientes y recordatorios',
    keywords: ['recordatorio', 'recordatorios', 'vencimiento', 'vence', 'vencido', 'pago pendiente', 'pagos pendientes', 'pagar', 'marcar pagado', 'factura vence'],
    text: 'Los recordatorios nacen al escanear una factura con fecha de vencimiento:',
    steps: [
      'Aparecen en el Panel, en "Pagos pendientes".',
      'Te aviso 3 días antes, el día que vence y una vez cuando vence.',
      'Al pagar, márcalo como pagado y se registra como gasto.',
    ],
    to: '/dashboard', label: 'Ir al Panel',
  },
  {
    id: 'notificaciones',
    title: 'Notificaciones',
    keywords: ['notificacion', 'notificaciones', 'campana', 'avisos', 'alertas', 'push', 'no me llegan', 'activar notificaciones'],
    text: 'Los avisos aparecen en la campana de arriba:',
    steps: [
      'Toca la campana para ver los avisos y marcarlos como leídos.',
      'Para recibirlos aunque no tengas la app abierta, toca "Activar notificaciones del navegador" y acepta el permiso.',
    ],
    extra: 'Si bloqueaste el permiso, hay que habilitarlo en la configuración del navegador.',
  },
  {
    id: 'hormiga',
    title: 'Gastos hormiga',
    keywords: ['hormiga', 'hormigas', 'compras chicas', 'gastos chicos', 'umbral', 'cafe', 'no es hormiga', 'avisos hormiga'],
    text: 'Un gasto hormiga es una compra chica y repetida. En "Gastos hormiga" puedes:',
    steps: [
      'Ver cuánto suman este mes y dónde se van.',
      'Fijar un tope y elegir si el umbral se calcula solo o a mano.',
      'Excluir lo que no cuenta con "No es hormiga" y activar o apagar los avisos.',
    ],
    to: '/hormiga', label: 'Ir a Gastos hormiga',
  },
  {
    id: 'analiticas',
    title: 'Analíticas',
    keywords: ['analitica', 'analiticas', 'estadisticas', 'grafico', 'graficos', 'proyeccion', 'promedio', 'insights', 'comparar periodos'],
    text: 'Analíticas resume tus gastos del período que elijas:',
    steps: [
      'Arriba a la derecha eliges el período.',
      'Ves total, promedio, gasto mayor y menor, y una proyección del mes.',
      'Más abajo hay gráficos por categoría y observaciones.',
    ],
    to: '/analytics', label: 'Ir a Analíticas',
  },
  {
    id: 'moneda',
    title: 'Moneda del perfil',
    keywords: ['moneda', 'dolar', 'peso', 'euro', 'cambiar moneda', 'divisa', 'simbolo'],
    text: 'Todos los importes salen en la moneda de tu perfil, con centavos si los hay.',
    steps: [
      'La app la detecta sola según tu navegador.',
      'Si falta o quieres otra, la guía del Panel ("Te ayudo a dejar tus datos listos") te deja elegirla.',
    ],
    to: '/dashboard', label: 'Ir al Panel',
  },
  {
    id: 'tema',
    title: 'Modo claro u oscuro',
    keywords: ['tema', 'oscuro', 'claro', 'modo oscuro', 'modo claro', 'fondo', 'color', 'dark'],
    text: 'Puedes cambiar el tema en cualquier momento:',
    steps: [
      'En la cabecera toca Oscuro o Claro.',
      'En el celular, usa el botón con el sol o la luna.',
    ],
  },
  {
    id: 'cuenta',
    title: 'Contraseña y cuenta',
    keywords: ['contrasena', 'password', 'olvide', 'recuperar', 'clave', 'salir', 'cerrar sesion', 'google', 'microsoft', 'cuenta', 'iniciar sesion'],
    text: 'Para tu cuenta:',
    steps: [
      'Salir: botón Salir de la cabecera (en el celular, tu inicial arriba a la derecha).',
      'Si olvidaste la contraseña: en la pantalla de acceso toca "¿Olvidaste tu contraseña?" y te enviamos un enlace por correo.',
      'También puedes entrar con Google o Microsoft.',
    ],
  },
  {
    id: 'atajos',
    title: 'Atajos de teclado',
    keywords: ['atajo', 'atajos', 'teclado', 'cmd', 'ctrl', 'rapido', 'shortcut'],
    text: 'Atajos disponibles:',
    steps: [
      'Cmd/Ctrl + N: en el Panel enfoca el formulario; en otras pantallas abre un gasto rápido.',
      'Escape: cierra ventanas y este chat.',
    ],
  },
];

/** Preguntas sugeridas según la pantalla en la que está la persona. */
const BY_ROUTE = {
  '/dashboard': ['registrar', 'escanear', 'saldo'],
  '/expenses': ['importar', 'filtros', 'editar'],
  '/budgets': ['presupuesto', 'saldo', 'registrar'],
  '/analytics': ['analiticas', 'filtros', 'hormiga'],
  '/hormiga': ['hormiga', 'notificaciones', 'presupuesto'],
};
const DEFAULT_SUGGESTED = ['registrar', 'escanear', 'presupuesto'];

export function suggestedFor(pathname) {
  const ids = BY_ROUTE[pathname] || DEFAULT_SUGGESTED;
  return ids.map((id) => TOPICS.find((t) => t.id === id)).filter(Boolean);
}

/** Puntaje de un tema para una pregunta: las palabras clave más largas (más específicas) pesan más. */
function score(topic, text) {
  return topic.keywords.reduce((sum, k) => {
    const key = normalize(k);
    if (!text.includes(key)) return sum;
    return sum + (key.includes(' ') ? 3 : 2) + Math.min(key.length / 10, 1);
  }, 0);
}

export function findTopic(question) {
  const text = normalize(question);
  if (!text) return null;
  const ranked = TOPICS.map((t) => ({ t, s: score(t, text) })).filter((r) => r.s > 0).sort((a, b) => b.s - a.s);
  return ranked.length ? ranked[0].t : null;
}

/** Respuesta en bloques { type: 'p' | 'steps' | 'link' }. Si no entiende, ofrece los temas de la pantalla. */
export function helpAnswer(question, pathname = '/dashboard') {
  const topic = findTopic(question);
  if (!topic) {
    return {
      topicId: null,
      blocks: [
        { type: 'p', text: 'No estoy seguro de haberte entendido. Soy un asistente de ayuda con respuestas preparadas sobre cómo usar la app. Prueba con una de estas preguntas o con otras palabras:' },
      ],
      suggestions: suggestedFor(pathname),
    };
  }
  const blocks = [{ type: 'p', text: topic.text }];
  if (topic.steps) blocks.push({ type: 'steps', items: topic.steps });
  if (topic.extra) blocks.push({ type: 'p', text: topic.extra });
  if (topic.to) blocks.push({ type: 'link', to: topic.to, label: topic.label });
  return { topicId: topic.id, blocks, suggestions: [] };
}
