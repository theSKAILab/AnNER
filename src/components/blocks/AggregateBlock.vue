<template>
  <mark class="aggregate-block"
  >
    <TokenBlock
        v-for="t in this.tokenBlocks"
        :key="`${t.type}-${t.start}`"
        :token="this.tokenManager.getBlockByStart(t.start)"
      />
  </mark>
</template>

<script lang="ts">
import TokenBlock from './TokenBlock.vue';
import { mapState } from 'vuex'

export default {
  name: 'AggregateBlock',
  components: {
    TokenBlock,
  },
  props: ['tokenBlocks'],
  computed: {
    ...mapState(['currentPage', 'labelManager', 'versionControlManager', 'tokenManager']),
  },
  methods: {
    
  },
}
</script>

<style lang="scss">
  .aggregate-block {
    margin-left: 5px;
    margin-right: 5px; 
    padding: 20px;
    background-color: #a3a3a3;
  }
</style>
