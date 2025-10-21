import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: { transformAssetUrls },
    }),
    vueDevTools(),
    quasar({
      sassVariables: fileURLToPath(new URL('./src/styles/quasar.variables.scss', import.meta.url)),
    }),
    VitePWA({ 
      registerType: 'autoUpdate',
      devOptions: {
          enabled: true
        },
      workbox: {
        navigateFallbackDenylist: [/^\/AnNER\/docs/,/^\/AnNER\/docs\//,/^\/AnNER\/pr-preview\//],
      }
    })
  ],
  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['**/*.spec.ts'],
    coverage: {
      // you can include other reporters, but 'json-summary' is required, json is recommended
      reporter: ['text', 'json-summary', 'json'],
      // If you want a coverage reports even if your tests are failing, include the reportOnFailure option
      reportOnFailure: true,
      thresholds: {
      lines: 95,
      branches: 95,
      functions: 50,
      statements: 95
      }
    },
  },
  base: '/AnNER/',
  define: {
    "__APP_VERSION__": JSON.stringify(process.env.npm_package_version),
  }
})
