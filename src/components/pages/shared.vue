<script lang="ts">
import { mapMutations, mapState } from 'vuex'
import Token from '../blocks/Token.vue'
import TokenBlock from '../blocks/TokenBlock.vue'
import LabelsBlock from '../blocks/LabelsBlock.vue'
import AggregateBlock from '../blocks/AggregateBlock.vue'
import InfoBar from '../toolbars/InfoBar.vue'
import { TMToken, TMTokenAggregate, TMTokenBlock } from '../managers/TokenManager'

export default {
  name: 'SharedEditorFunctions',
  components: {
    Token,
    TokenBlock,
    LabelsBlock,
    InfoBar,
    AggregateBlock
  },
  data() {
    return {
      TMToken,
      TMTokenAggregate,
      TMTokenBlock
    }
  },
  computed: {
    ...mapState([
      'currentPage',
      'currentIndex',
      'labelManager',
      'annotationManager',
      'tokenManager',
      'versionControlManager',
      'tokenManagers'
    ]),
    tmEdited() {
      if (this.tokenManager) {
        return this.tokenManager.edited
      }
      return []
    },
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
  watch: {
    tmEdited: {
      handler() {
        this.tokenizeCurrentSentence()
      },
      deep: true,
    },
    currentIndex() {
      this.tokenizeCurrentSentence()
    },
  },
  methods: {
    ...mapMutations([
      'nextSentence',
      'previousSentence',
      'addUndoCreate',
      'addUndoDelete',
      'addUndoOverlapping',
      'setTokenManager',
    ]),
    /**
     * Tokenizes the current sentence and sets the TokenManager
     */
    tokenizeCurrentSentence() {
      this.setTokenManager(this.tokenManagers[this.currentIndex] || null)
    },
    /**
     * Adds a new block to the TokenManager based on the current selection
     */
    selectTokens(e: MouseEvent) {
      if (e.detail > 1) {
        return
      } // Prevent double-click from selecting text
      const selection: Selection | null = document.getSelection()
      if (
        selection?.anchorOffset === selection?.focusOffset &&
        selection?.anchorNode === selection?.focusNode
      ) {
        return
      }

      const rangeStart = selection?.getRangeAt(0)
      const rangeEnd = selection?.getRangeAt(selection?.rangeCount - 1)

      let start, end
      try {
        start = parseInt(rangeStart.startContainer.parentElement.id.replace('t', ''))
        const offsetEnd = parseInt(rangeEnd.endContainer.parentElement.id.replace('t', ''))
        end = offsetEnd + rangeEnd.endOffset
      } catch {
        return
      }

      // No classes available to tag
      if (!this.labelManager.lastId && selection?.anchorNode) {
        this.$q.dialog({
          title: 'No Tags Available',
          message: 'Please add some Tags before tagging.',
        })
        selection?.empty()
        return
      }

      // Attempt to create a new block

      // Determine if the selection will overlap with an existing block and add to undo stack accordingly
      const existingBlocks = this.tokenManager.isOverlapping(start, end)
      if (existingBlocks) {
        // Prompt to user to confirm overlapping blocks
        this.$q
          .dialog({
            title: 'Overlapping Annotations',
            message:
              'Your selection overlaps with existing annotations. Continuing will apply your current selection to the existing block. Do you want to proceed?',
            cancel: true,
            persistent: true,
          })
          .onOk(() => {
            this.versionControlManager.addUndo(this.tokenManager)
            this.tokenManager.addNewBlock(
              start,
              end,
              this.labelManager.currentLabel,
              'Suggested',
              [],
            )
          })
      } else {
        this.versionControlManager.addUndo(this.tokenManager)
        this.tokenManager.addNewBlock(
          start,
          end,
          this.labelManager.currentLabel,
          this.currentPage == 'annotate' ? 'Candidate' : 'Suggested',
          [],
        )
      }

      selection?.empty()
    },
    // Callbacks for Token and TokenBlock components
    /**
     * Removes TokenBlock from the TokenManager
     * @param {Number} blockStart - The start position of the block to remove
     */
    onRemoveBlock(blockStart: number) {
      this.versionControlManager.addUndo(this.tokenManager)
      this.tokenManager.removeBlock(blockStart)
    },
    beforeLeave() {
      return 'Leaving this page will discard any unsaved changes.'
    },
  },
}
</script>
