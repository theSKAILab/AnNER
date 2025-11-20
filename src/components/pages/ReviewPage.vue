<template>
  <div>
    <labels-block />
    <div class="q-pa-lg" style="height: calc(100vh - 190px); overflow-y: scroll">
      <template v-for="t in eligibleTokens" :key="`${t.type}-${t.start}`">
        <token v-if="t instanceof TMToken" 
          :token="t"
          :class="[t.reviewed ? 'user-active' : 'user-inactive']" />

        <token-block v-else-if="t instanceof TMTokenBlock"
          :token="t"
          :class="[t.reviewed ? 'user-active' : 'user-inactive']"
          @remove-block="onRemoveBlock" />
      </template>
    </div>
    <info-bar />
  </div>
</template>
<script lang="ts">
import { TMToken, TMTokenBlock, type TMTokens } from '../managers/TokenManager';
import SharedEditorFunctions from './shared.vue'

export default {
  name: 'ReviewPage',
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
