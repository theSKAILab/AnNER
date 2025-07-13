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
        } 
    })
  ],
  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  base: '/AnNER/',
  define: {
    "__APP_VERSION__": JSON.stringify(process.env.npm_package_version),
  }
})
