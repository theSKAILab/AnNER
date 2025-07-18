<template>
  <div>
    <labels-block />
    <div class="q-pa-lg" style="height: calc(100vh - 190px); overflow-y: scroll">
      <component
        v-for="t in eligibleTokens"
        :key="`${t.type}-${t.start}`"
        :is="t.type === 'token' ? 'Token' : 'TokenBlock'"
        :token="t.type == 'token-block' ? this.tokenManager.getBlockByStart(t.start) : t"
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
  name: 'ReviewPage',
  components: {
    Token,
    TokenBlock,
    LabelsBlock,
    InfoBar,
  },
  computed: {
    ...mapState(['annotations']),
    // TODO: THIS SHOULD BE REWRITTEN BETTER
    eligibleTokens() {
      const renderedList = []
      for (let i = 0; i < this.tokenManager.tokens.length; i++) {
        const t = this.tokenManager.tokens[i]
        const tokenOverlapping = this.tokenManager.isOverlapping(t.start, t.end)
        if (!tokenOverlapping) {
          renderedList.push(t)
        } else if (
          t.currentState == 'Rejected' &&
          tokenOverlapping != null &&
          t == tokenOverlapping[0]
        ) {
          renderedList.push(t)
        } else if (t.currentState != 'Rejected' && tokenOverlapping != null) {
          renderedList.push(t)
        }
      }
      return renderedList
    },
  },
  created() {
    // Add blocks for all paragraphs
    if (this.annotationManager.inputSentences.length) {
      this.tokenizeCurrentSentence()
    }
    document.addEventListener('mouseup', (e) => this.selectTokens(e))
    window.onbeforeunload = this.beforeLeave

    // Emits
    this.emitter.on('tokenizeCurrentSentence', (e) => this.selectTokens(e))
  },
  beforeUnmount() {
    document.removeEventListener('mouseup', this.selectTokens)

    // Remove emits
    this.emitter.off('tokenizeCurrentSentence', this.tokenizeCurrentSentence)
  },
  mixins: [SharedEditorFunctions],
}
</script>
