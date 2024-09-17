import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: '.', // Explicitly set root to the current directory (optional but clearer)
  build: {
    outDir: 'dist', // Ensure the output directory is set to 'dist'
  },
});
