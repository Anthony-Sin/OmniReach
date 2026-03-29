import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(), 
        tailwindcss(),
        nodePolyfills({
          include: ['stream', 'path', 'url', 'crypto', 'os', 'child_process', 'fs', 'util'],
          globals: {
            Buffer: true,
            global: true,
            process: true,
          },
        }),
      ],
      define: {
        'process.env.API_KEY': env.GEMINI_API_KEY ? JSON.stringify(env.GEMINI_API_KEY) : 'undefined',
        'process.env.GEMINI_API_KEY': env.GEMINI_API_KEY ? JSON.stringify(env.GEMINI_API_KEY) : 'undefined',
        'process.env.GOOGLE_MAPS_API_KEY': env.GOOGLE_MAPS_API_KEY ? JSON.stringify(env.GOOGLE_MAPS_API_KEY) : 'undefined'
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          'fs/promises': path.resolve(__dirname, 'src/lib/empty.ts'),
          'node:fs/promises': path.resolve(__dirname, 'src/lib/empty.ts'),
          'stream/web': path.resolve(__dirname, 'src/lib/empty.ts'),
          'node:stream/web': path.resolve(__dirname, 'src/lib/empty.ts'),
        }
      }
    };
});
