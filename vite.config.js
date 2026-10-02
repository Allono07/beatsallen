import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function spaFallback() {
  return {
    name: 'spa-fallback',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '/';
        const isFileRequest = url.includes('.') || url.startsWith('/@') || url.startsWith('/src/') || url.startsWith('/node_modules/') || url.startsWith('/favicon');
        if (!isFileRequest && !url.startsWith('/api')) {
          req.url = '/';
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '/';
        const isFileRequest = url.includes('.') || url.startsWith('/@') || url.startsWith('/src/') || url.startsWith('/node_modules/') || url.startsWith('/favicon');
        if (!isFileRequest && !url.startsWith('/api')) {
          req.url = '/';
        }
        next();
      });
    },
  };
}

export default defineConfig({
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  plugins: [react(), spaFallback()],
  server: {
    host: '0.0.0.0',
    port: 8000,
    strictPort: false,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
  build: {
    outDir: 'dist',
  },
});
