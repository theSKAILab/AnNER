<template>
  <mark
    :class="['bg-' + this.labelClass.color, { 'shadow-unreviewed': !this.reviewed }]"
    style="margin-left: 5px; margin-right: 5px"
  >
    <Token v-for="t in token.tokens" :key="t.start" :token="t" />
    <span class="tag">
      <!-- Toggle status cycle button -->
      <i
        v-if="this.currentPage === 'review'"
        :class="this.states[this.currentState].icon"
        @click="cycleCurrentStatus"
        :title="[this.currentState + ' - Click to cycle status']"
        style="cursor: pointer; color: grey-9"
      ></i>
      {{ this.labelClass.name }}
      <!-- Replace label button (double arrows) -->
      <q-btn
        icon="fa fa-exchange-alt"
        round
        flat
        size="xs"
        text-color="grey-7"
        title="Change label to currently selected label"
        @click="changeClass"
      />
      <!-- Delete label button (X) -->
      <q-btn
        icon="fa fa-times-circle"
        round
        flat
        size="xs"
        text-color="grey-7"
        title="Delete annotation"
        @click.stop="removeBlock"
      />
      <q-btn
        v-if="this.currentPage === 'review'"
        :icon="this.reviewed ? 'fas fa-toggle-on' : 'fas fa-toggle-off'"
        round
        flat
        size="xs"
        text-color="grey-9"
        title="Dark indicates that you have reviewed this annotation, light means you have not."
        @click.stop="toggleReviewed"
      />
    </span>
  </mark>
</template>

<script lang="ts">
import { mapMutations } from 'vuex/dist/vuex.cjs.js'
import Token from './Token'
import { mapState } from 'vuex'

export default {
  name: 'TokenBlock',
  components: {
    Token,
  },
  props: [
    'token',
    'currentState', // v-model
    'labelClass', // v-model
    'reviewed', // v-model
    'history',
  ],
  emits: [
    'update:currentState', // v-model
    'update:labelClass', // v-model
    'update:reviewed', // v-model
  ],
  data() {
    return {
      states: {
        Candidate: { numeric: 0, icon: 'fas fa-question fa-lg' },
        Accepted: { numeric: 1, icon: 'fas fa-thumbs-up fa-lg' },
        Rejected: { numeric: 2, icon: 'fas fa-thumbs-down fa-lg' },
        Suggested: { numeric: 3, icon: 'fas fa-pen fa-lg' },
      },
    }
  },
  computed: {
    ...mapState(['currentPage', 'labelManager', 'undoManager']),
  },
  methods: {
    ...mapMutations(['addUndoUpdate']),
    cycleCurrentStatus() {
      this.undoManager.addUpdateUndo({ ...this.token })
      const nextState = Object.keys(this.states)[(this.states[this.currentState].numeric + 1) % 3] // Cycle through Candidate, Accepted, Rejected
      this.setReviewed(true)
      this.updateState(nextState)
    },
    changeClass() {
      this.undoManager.addUpdateUndo({ ...this.token })
      this.setReviewed(true)
      if (this.currentPage === 'review') {
        this.updateState('Suggested')
      }
      this.updateLabelClass()
    },
    updateState(newState) {
      this.$emit('update:currentState', newState)
    },
    updateLabelClass() {
      this.$emit('update:labelClass', this.labelManager.currentLabel)
    },
    removeBlock() {
      if (this.currentPage == 'review') {
        this.undoManager.addUpdateUndo({ ...this.token })
        this.updateState('Rejected')
        this.setReviewed(true)
      } else {
        this.$emit('remove-block', this.token.start)
      }
    },
    toggleReviewed() {
      this.$emit('update:reviewed', !this.reviewed)
    },
    setReviewed(state) {
      this.$emit('update:reviewed', state)
    },
  },
}
</script>

<style lang="scss">
  i {
    cursor: pointer;
  }
  mark {
    padding: 0.7rem;
    /* Increased from 0.5rem */
    position: relative;
    background-color: burlywood;
    border: 2px solid $grey-7;
    /* Thicker border for emphasis */
    border-radius: 0.5rem;
    /* Larger border-radius */
  }

  .tag {
    background-color: whitesmoke;
    padding: 6px 0 8px 16px;
    /* Increased padding for larger tag area */
    border: 2px solid grey;
    /* Thicker border */
    border-radius: 0.5rem;
    /* Larger border-radius */
    font-size: small;
    /* Increased font size for better visibility */
  }

  .shadow-unreviewed {
    box-shadow: 0 0 2px 2px goldenrod;
    /* Larger and more pronounced shadow */
  }

  .bg-red {
    box-shadow: 0 0 2px 2px red;
    /* Larger and more pronounced shadow */
  }
</style>
