<template>
  <div
    class="fullscreen"
    @dragover.prevent="onDragEnter"
    @dragenter="onDragEnter"
    @dragleave.self="onDragLeave"
    @drop.stop.prevent="onDrop"
    style="overflow-y: scroll"
  >
    <div :style="{ 'pointer-events': overlayActive ? 'none' : 'auto' }">
      <q-layout view="hHh lpR fFf">
        <menu-bar />
        <q-page-container>
          <start-page v-if="currentPage === 'start'" />
          <annotation-page v-if="currentPage === 'annotate'" />
          <review-page v-if="currentPage === 'review'" />
        </q-page-container>
      </q-layout>
      <!-- Drag/Drop Overlay -->
      <div
        class="fullscreen column justify-center bg-black"
        :style="{ visibility: overlayActive && pendingFileDrop == null ? 'visible' : 'hidden' }"
      >
        <div class="column items-center">
          <p class="text-h2 text-white">
            <q-icon name="fas fa-upload" />
          </p>
          <p class="text-h3 text-white">Drop file to upload.</p>
        </div>
      </div>
      <exit-dialog
        :show="pendingFileDrop != null && currentPage != 'start'"
        @hide="pendingFileDrop = null"
        @confirm="processFileDrop()"
      />
    </div>
  </div>
</template>

<script>
import MenuBar from './components/toolbars/MenuBar.vue'
import StartPage from './components/pages/StartPage.vue'
import AnnotationPage from './components/pages/AnnotationPage.vue'
import ReviewPage from './components/pages/ReviewPage.vue'
import { mapState, mapMutations } from 'vuex'
import { useQuasar } from 'quasar'

export default {
  name: 'LayoutDefault',
  setup() {
    const $q = useQuasar()
    return {
      notify(icon, message, level) {
        $q.notify({
          icon,
          message,
          color: level,
          position: 'top',
          timeout: 2000,
          actions: [
            {
              label: 'Dismiss',
              color: 'white',
            },
          ],
        })
      },
    }
  },
  data() {
    return {
      overlayActive: false,
      pendingFileDrop: null,
    }
  },
  components: {
    MenuBar,
    StartPage,
    AnnotationPage,
    ReviewPage,
  },
  computed: {
    ...mapState(['classes', 'currentPage']),
  },
  methods: {
    ...mapMutations(['setCurrentPage', 'loadFile']),
    onDragEnter() {
      if (this.currentPage == 'start') this.overlayActive = true
    },
    onDragLeave() {
      if (this.currentPage == 'start') this.overlayActive = false
    },
    onDrop(event) {
      this.overlayActive = false
      this.pendingFileDrop = event.dataTransfer.files[0]
      if (this.currentPage == 'start') this.loadFile(this.pendingFileDrop)
    },
  },
}
</script>
