import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: '.', // Ensure the root is set to the current directory
  publicDir: 'public', // Point to the 'public' directory for static assets
  build: {
    outDir: 'dist', // Ensure the output directory is set to 'dist'
    rollupOptions: {
      input: './index.html', // Explicitly point to the 'index.html' file
    },
  },
});
