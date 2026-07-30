import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Test config lives in vitest.config.ts to avoid a type conflict between
// this project's vite version and the one vitest bundles internally.
export default defineConfig({
  plugins: [react()],
})
