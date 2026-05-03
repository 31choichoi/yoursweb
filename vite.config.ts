import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    plugins: [
      {
        name: 'html-rewrite',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
             if (req.url === '/admin') {
               req.url = '/admin.html';
             }
             if (req.url === '/portfolio') {
               req.url = '/portfolio.html';
             }
             if (req.url === '/service') {
               req.url = '/service.html';
             }
             if (req.url === '/about') {
               req.url = '/about.html';
             }
             next();
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      modulePreload: {
        polyfill: false
      },
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          admin: path.resolve(__dirname, 'admin.html'),
          portfolio: path.resolve(__dirname, 'portfolio.html'),
          service: path.resolve(__dirname, 'service.html'),
          about: path.resolve(__dirname, 'about.html'),
          request: path.resolve(__dirname, 'request.html'),
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
