/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      // In test mode, disable Babel plugin to avoid esbuild/OXC conflict in vitest v4
      ...(mode === 'test' ? { babel: { plugins: [] } } : {}),
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/tests/**/*.test.{ts,tsx}'],
    pool: 'vmThreads',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/tests/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/types/**',
        'src/App.tsx',
        // Complex pages with heavy API integration — covered by backend tests
        'src/pages/Market.tsx',
        'src/pages/PortfolioDetail.tsx',
        'src/pages/Portfolios.tsx',
        'src/pages/Watchlists.tsx',
        'src/pages/Home.tsx',
        'node_modules/**',
        'dist/**',
      ],
      thresholds: {
        statements: 55,
        branches: 50,
        functions: 55,
        lines: 55,
      },
    },
  },
}))
