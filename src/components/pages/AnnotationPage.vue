<template>
  <div>
    <labels-block />
    <div class="q-pa-lg" style="height: calc(100vh - 190px); overflow-y: scroll">
      <component
        :is="t.type === 'token' ? 'Token' : 'TokenBlock'"
        v-for="t in this.tokenManager.tokens"
        :key="`${t.type}-${t.start}`"
        :token="t.type == 'token-block'? this.tokenManager.getBlockByStart(t.start): t"
        :class="[t.reviewed ? 'user-active' : 'user-inactive']"
        @remove-block="onRemoveBlock"
      />
    </div>
    <info-bar />
  </div>
</template>
<script>
import { mapState } from 'vuex'
import Token from '../blocks/Token'
import TokenBlock from '../blocks/TokenBlock'
import LabelsBlock from '../blocks/LabelsBlock.vue'
import InfoBar from '../toolbars/InfoBar.vue'
import SharedEditorFunctions from './shared.vue'

export default {
  name: 'AnnotationPage',
  components: {
    Token,
    TokenBlock,
    LabelsBlock,
    InfoBar,
  },
  computed: {
    ...mapState(['currentIndex']),
  },
  created() {
    // Add blocks for all paragraphs
    if (this.annotationManager.inputSentences.length) {
      this.tokenizeCurrentSentence()
    }
    document.addEventListener('mouseup', (e) => this.selectTokens(e))
    window.onbeforeunload = this.beforeLeave

    // Emits
    this.emitter.on('tokenizeCurrentSentence', this.tokenizeCurrentSentence)
  },
  beforeUnmount() {
    document.removeEventListener('mouseup', (e) => this.selectTokens(e))

    // Remove emits
    this.emitter.off('tokenizeCurrentSentence', this.tokenizeCurrentSentence)
  },
  mixins: [SharedEditorFunctions],
}
</script>
