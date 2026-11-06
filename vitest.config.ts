import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    // 'threads' bu makinede (Node 24) worker başlatamıyor; forks + kontrollü paralellik kararlı.
    pool: 'forks',
    maxWorkers: 2,
    minWorkers: 1,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.{js,ts,tsx}'],
  },
});
