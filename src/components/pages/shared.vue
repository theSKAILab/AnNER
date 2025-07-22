<script lang="ts">
import { mapMutations, mapState } from 'vuex'
import Tokenizer from '../classes/Tokenizer'
import { TokenManager, TMTokenBlock } from '../classes/TokenManager'

export default {
  name: 'SharedEditorFunctions',
  computed: {
    ...mapState([
      'currentPage',
      'currentIndex',
      'labelManager',
      'annotationManager',
      'tokenManager',
      'undoManager',
    ]),
    tmEdited() {
      if (this.tokenManager) {
        return this.tokenManager.edited
      }
      return []
    },
  },
  watch: {
    tmEdited: {
      handler() {
        this.tokenizeCurrentSentence()
        this.save()
      },
      deep: true,
    },
    currentIndex() {
      this.tokenizeCurrentSentence()
      this.save()
    }
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
      this.setTokenManager(
        new TokenManager(
          this.labelManager,
          Tokenizer.span_tokenize(this.annotationManager.inputSentences[this.currentIndex].text),
          this.annotationManager.annotations[this.currentIndex],
        ),
      )
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
            this.undoManager.addOverlappingUndo(existingBlocks, start)
            this.tokenManager.addNewBlock(
              start,
              end,
              this.labelManager.currentLabel,
              'Suggested',
              [],
            )
          })
      } else {
        this.tokenManager.addNewBlock(
          start,
          end,
          this.labelManager.currentLabel,
          this.currentPage == 'annotate' ? 'Candidate' : 'Suggested',
          [],
        )
        if (this.tokenManager.getBlockByStart(start)) this.undoManager.addCreateUndo(start)
      }

      selection?.empty()
      this.save()
    },
    // Callbacks for Token and TokenBlock components
    /**
     * Removes TokenBlock from the TokenManager
     * @param {Number} blockStart - The start position of the block to remove
     */
    onRemoveBlock(blockStart: number) {
      this.undoManager.addDeleteUndo(this.tokenManager.getBlockByStart(blockStart))
      this.tokenManager.removeBlock(blockStart)
      this.save()
    },
    /**
     * Saves the current annotation to the store
     */
    save() {
      this.annotationManager.annotations[this.currentIndex].entities =
        this.tokenManager.tokenBlocks.map((block: TMTokenBlock) => block.exportAsEntity())
    },
    beforeLeave() {
      return 'Leaving this page will discard any unsaved changes.'
    },
  },
}
</script>
