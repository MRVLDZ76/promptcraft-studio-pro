import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Expose API keys to import.meta.env
        'import.meta.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'import.meta.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY),
        // Legacy support
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        },
        extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json']
      }
    };
});
