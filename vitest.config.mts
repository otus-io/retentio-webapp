import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'tests/e2e/**',
      'e2e/**',
    ],
  },
  resolve: {
    tsconfigPaths: true,
    // Tests run outside the react-server layer; use the real module so server paths are exercised.
    alias: { '#server-token': new URL('./src/lib/token.ts', import.meta.url).pathname },
  },
})
