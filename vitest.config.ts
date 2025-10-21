import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
  setupFiles: ['./test/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      all: true,
      include: ['src/**/*'],
      exclude: ['src/type_declarations/**', 'src/components/types/**', 'src/components/types/**'],
    },
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
  ,
  plugins: [vue()],
})
