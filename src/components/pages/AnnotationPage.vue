<template>
  <div>
    <labels-block />
    <div class="q-pa-lg" style="height: calc(100vh - 190px); overflow-y: scroll">
      <template v-for="t in this.tokenManager.tokens" :key="`${t.type}-${t.start}`">
        <token v-if="t.type === 'token'" 
          :token="t"
          :class="[t.reviewed ? 'user-active' : 'user-inactive']" />

        <aggregate-block v-else-if="this.tokenManager.isOverlapping(t.start, t.end)"
            :tokenBlocks="this.tokenManager.getOverlappingBlocks(t.start, t.end)"
            @remove-block="onRemoveBlock" />

        <token-block v-else
          :token="this.tokenManager.getBlockByStart(t.start)"
          :class="[t.reviewed ? 'user-active' : 'user-inactive']"
          @remove-block="onRemoveBlock" />
      </template>
    </div>
    <info-bar />
  </div>
</template>
<script lang="ts">
import SharedEditorFunctions from './shared.vue'

export default {
  name: 'AnnotationPage',
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
