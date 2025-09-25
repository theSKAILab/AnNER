<template>
  <mark
    :class="['bg-' + this.token.labelClass.color, { 'shadow-unreviewed': !this.token.reviewed }]"
    style="margin-left: 5px; margin-right: 5px"
  >
    <Token v-for="t in token.tokens" :key="t.start" :token="t" />
    <span class="tag">
      <!-- Toggle status cycle button -->
      <i
        v-if="this.currentPage === 'review'"
        :class="this.states[this.token.currentState].icon"
        @click="cycleCurrentStatus"
        :title="[this.token.currentState + ' - Click to cycle status']"
        style="cursor: pointer; color: grey-9"
      ></i>
      {{ this.token.labelClass.name }}
      <!-- Replace label button (double arrows) -->
      <q-btn
        icon="fa fa-exchange-alt"
        round
        flat
        size="xs"
        text-color="grey-7"
        title="Change label to currently selected label"
        @click="changeLabel"
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
        :icon="this.token.reviewed ? 'fas fa-toggle-on' : 'fas fa-toggle-off'"
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
import Token from './Token'
import { mapState } from 'vuex'

export default {
  name: 'TokenBlock',
  components: {
    Token,
  },
  props: ['token'],
  emits: ['remove-block'],
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
    ...mapState(['currentPage', 'labelManager', 'undoManager', 'tokenManager']),
  },
  methods: {
    cycleCurrentStatus() {
      this.undoManager.addUpdateUndo({ ...this.token })
      const nextState = Object.keys(this.states)[
        (this.states[this.token.currentState].numeric + 1) % 3
      ] // Cycle through Candidate, Accepted, Rejected

      this.token.currentState = nextState
      this.token.reviewed = true
    },
    changeLabel() {
      this.undoManager.addUpdateUndo({ ...this.token })
      this.token.reviewed = true
      if (this.currentPage === 'review') {
        this.token.currentState = 'Suggested'
      }
      this.token.labelClass = this.labelManager.currentLabel
    },
    removeBlock() {
      if (this.currentPage == 'review') {
        this.undoManager.addUpdateUndo({ ...this.token })
        this.token.currentState = 'Rejected'
        this.token.reviewed = true
      } else {
        this.$emit('remove-block', this.token.start)
      }
    },
    toggleReviewed() {
      if (this.token.reviewed) {
        // Undo all changes made to this block since the last reviewer (initial token manager load)
        this.tokenManager.restoreOriginalBlockState(this.token.start)
      } else {
        this.token.reviewed = !this.reviewed
      }
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
