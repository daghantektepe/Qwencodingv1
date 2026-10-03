import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * OpenScriv — Vite yapılandırması (Faz 29 düzeltmesi).
 *
 * p29-s2 değişiklikleri:
 *  - resolve.extensions: .jsx/.js uzantılı bileşenlerin (Scratchpad, Corkboard,
 *    StatusBar vb.) App.tsx içinden sorunsuz çözümlenmesi garanti altına alındı.
 *  - test (Vitest): jsdom ortamı, globals ve setupFiles ile React test
 *    altyapısı tanımlandı; tsconfig kapsamı tests/ dizinini de içeriyor.
 */
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.cjs', '.json'],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
  },
});
