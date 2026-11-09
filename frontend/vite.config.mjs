import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // El mismo puerto que usaba Create React App (el backend lo tiene en su lista de CORS)
    port: 3000,
  },
  build: {
    // Se mantiene "build": vercel.json (distDir), el Dockerfile y .gitignore ya apuntan a esa carpeta
    outDir: 'build',
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
