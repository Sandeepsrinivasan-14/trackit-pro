import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Output stays in `build/` (what CRA used) so existing hosting settings keep working.
export default defineConfig({
  plugins: [react()],
  server: { port: 3000 },
  build: { outDir: 'build' },
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    globals: true,
  },
});
