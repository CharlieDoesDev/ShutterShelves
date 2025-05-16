import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/ShutterShelves/',
  plugins: [react()],
  // no dotenv, no define:{…}
});
