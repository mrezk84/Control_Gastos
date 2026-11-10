import { findTopic, helpAnswer, suggestedFor, TOPICS } from './ayuda';

describe('asistente de ayuda', () => {
  test.each([
    ['¿Cómo registro un gasto?', 'registrar'],
    ['quiero escanear una factura con la cámara', 'escanear'],
    ['me equivoqué, cómo borro un gasto', 'editar'],
    ['cómo exporto a Excel', 'importar'],
    ['quiero pasar mis datos de otra app', 'importar'],
    ['como creo un presupuesto', 'presupuesto'],
    ['qué es el semáforo', 'saldo'],
    ['no me llegan las notificaciones', 'notificaciones'],
    ['qué es un gasto hormiga', 'hormiga'],
    ['olvidé mi contraseña', 'cuenta'],
    ['quiero modo oscuro', 'tema'],
  ])('"%s" → %s', (question, id) => {
    expect(findTopic(question)?.id).toBe(id);
  });

  test('ignora mayúsculas y tildes', () => {
    expect(findTopic('PRESUPUESTO')?.id).toBe('presupuesto');
    expect(findTopic('presupuesto')?.id).toBe('presupuesto');
  });

  test('una pregunta sin relación no inventa una respuesta', () => {
    const r = helpAnswer('¿cuál es la capital de Francia?', '/expenses');
    expect(r.topicId).toBeNull();
    expect(r.suggestions.length).toBe(3);
    expect(r.blocks[0].text).toMatch(/No estoy seguro/);
  });

  test('una pregunta vacía no responde nada', () => {
    expect(findTopic('   ')).toBeNull();
  });

  test('la respuesta trae pasos y, si corresponde, el enlace', () => {
    const r = helpAnswer('cómo registro un gasto');
    expect(r.blocks.some((b) => b.type === 'steps')).toBe(true);
    expect(r.blocks.find((b) => b.type === 'link')).toMatchObject({ to: '/dashboard' });
  });

  test('las sugerencias cambian según la pantalla', () => {
    expect(suggestedFor('/expenses').map((t) => t.id)).toEqual(['importar', 'filtros', 'editar']);
    expect(suggestedFor('/ruta-rara').length).toBe(3);
  });

  test('todos los temas tienen texto, y los enlaces llevan a rutas de la app', () => {
    const routes = ['/dashboard', '/expenses', '/budgets', '/analytics', '/hormiga'];
    TOPICS.forEach((t) => {
      expect(t.text.length).toBeGreaterThan(10);
      if (t.to) expect(routes).toContain(t.to);
    });
  });
});
