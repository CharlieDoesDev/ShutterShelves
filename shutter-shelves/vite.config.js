import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.production' });

export default defineConfig({
  base: '/YOUR_REPO_NAME/',
  plugins: [react()],
  define: {
    'import.meta.env.VITE_AOAI_KEY': JSON.stringify(process.env.VITE_AOAI_KEY),
    'import.meta.env.VITE_AOAI_ENDPOINT': JSON.stringify(process.env.VITE_AOAI_ENDPOINT),
    'import.meta.env.VITE_AOAI_DEPLOYMENT': JSON.stringify(process.env.VITE_AOAI_DEPLOYMENT),
    'import.meta.env.VITE_AOAI_API_VERSION': JSON.stringify(process.env.VITE_AOAI_API_VERSION),
  },
});
