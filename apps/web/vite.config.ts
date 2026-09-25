import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, fileURLToPath(new URL('../../', import.meta.url)), 'PLAYGROUND_');
  const port = process.env.PLAYGROUND_PORT ?? env.PLAYGROUND_PORT ?? '4310';
  return {
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: { proxy: { '/api': { target: `http://127.0.0.1:${port}`, changeOrigin: true } } },
    build: { sourcemap: false },
  };
});
