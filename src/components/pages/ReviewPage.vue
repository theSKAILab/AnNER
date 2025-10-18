<template>
  <div>
    <labels-block />
    <div class="q-pa-lg" style="height: calc(100vh - 190px); overflow-y: scroll">
      <template v-for="t in eligibleTokens" :key="`${t.type}-${t.start}`">
        <token v-if="t instanceof TMToken" 
          :token="t"
          :class="[t.reviewed ? 'user-active' : 'user-inactive']" />

        <aggregate-block v-else-if="t instanceof TMTokenAggregate"
          :tokenBlocks="t.tokenBlocks"
          @remove-block="onRemoveBlock" />

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
import { TMToken, TMTokenAggregate, TMTokenBlock, type TMTokens } from '../managers/TokenManager';
import SharedEditorFunctions from './shared.vue'

export default {
  name: 'ReviewPage',
  computed: {
    // TODO: THIS SHOULD BE REWRITTEN BETTER
    eligibleTokens() {
      const renderList: TMTokens[] = [];

      for (let i = 0; i < this.tokenManager.tokens.length; i++) {
        const t = this.tokenManager.tokens[i];
        if (t instanceof TMToken) {
          renderList.push(t);
        } else if (t instanceof TMTokenBlock) {
          // Check if overlapping with any other blocks
          const overlapping = this.tokenManager.isOverlapping(t.start, t.end);
          if (overlapping && overlapping.length > 1) {
            // If overlapping, check to ensure if entire overlap range is already in the list
            // If not, add the entire list returned by isOverlapping to the renderList
            const overlapAggregate = new TMTokenAggregate(overlapping);
            if (!renderList.find(r => r instanceof TMTokenAggregate && r.start === overlapAggregate.start && r.end === overlapAggregate.end)) {
              renderList.push(overlapAggregate);
            }
          } else {
            // If not overlapping, add the block itself
            renderList.push(t);
          }
        }
      }
      return renderList;
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
