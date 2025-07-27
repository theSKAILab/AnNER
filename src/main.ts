// Import Vue and other necessary libraries
import { createApp } from 'vue'
import App from './App.vue'

// Plugin Imports
import mitt from 'mitt'

// Store Imports
import { store, key } from './components/managers/Store'

// Quasar and Plugin Imports
import './styles/quasar.scss'
import '@quasar/extras/fontawesome-v5/fontawesome-v5.css'
import '@quasar/extras/ionicons-v4/ionicons-v4.css'
import 'quasar/src/css/index.sass'
import { Notify, Dialog } from 'quasar'
import { Quasar } from 'quasar'
import iconSet from 'quasar/icon-set/fontawesome-v5.js'

const app = createApp(App)
  .use(Quasar, {
    config: {},
    plugins: {
      Notify,
      Dialog,
    },
    iconSet: iconSet,
  })
  .use(store, key)

app.config.globalProperties.emitter = mitt()

app.mount('#app')
