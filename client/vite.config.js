import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Le client parle a l'API en relatif : pas de CORS, pas de variable d'env.
    proxy: {
      '/api': { target: process.env.API_URL || 'http://localhost:3001', changeOrigin: true },
    },
  },
});
