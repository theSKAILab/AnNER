import './registerServiceWorker'
// import 'es6-promise/auto'
import 'quasar/src/css/index.sass'

import { createApp } from 'vue'
import { createStore } from 'vuex'
import { Quasar } from 'quasar'
import App from './App.vue'
import mitt from 'mitt'
import store from './store'

import './styles/quasar.scss'
import iconSet from 'quasar/icon-set/fontawesome-v5.js'
import '@quasar/extras/fontawesome-v5/fontawesome-v5.css'
import '@quasar/extras/ionicons-v4/ionicons-v4.css'
import { Notify, Dialog } from 'quasar'

const app = createApp(App).use(Quasar, {
  config: {},
  plugins: {
    Notify,
    Dialog,
  },
  iconSet: iconSet,
}).use(createStore(store))

app.config.globalProperties.emitter = mitt()

app.mount('#app')
