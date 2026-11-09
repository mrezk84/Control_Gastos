# Frontend de Control Gastos

React 18 + [Vite](https://vite.dev) + React Router. Pruebas con [Vitest](https://vitest.dev).
Requiere Node 22.12 o superior.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm start` (o `npm run dev`) | Servidor de desarrollo en http://localhost:3000 |
| `npm run build` | Compila para producción en `build/` |
| `npm run preview` | Sirve `build/` localmente para probarlo |
| `npm test` | Ejecuta las pruebas una vez (`npm run test:watch` las deja en observación) |

## Variables de entorno

Solo las que empiezan por `VITE_` llegan al navegador, y por eso **nunca deben contener secretos**.

- Desarrollo: crea `frontend/.env` con `VITE_API_URL=http://localhost:8000`.
- Producción: `frontend/.env.production` (ver `DEPLOY.md` §4).

## Notas

- Los componentes con JSX usan la extensión `.jsx` (Vite no interpreta JSX dentro de `.js`).
- `vite.config.mjs` mantiene la carpeta de salida `build/` para no cambiar `vercel.json` ni el `Dockerfile`.
