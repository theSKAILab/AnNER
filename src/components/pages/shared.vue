<script lang="ts">
import { mapMutations, mapState } from 'vuex'
import Token from '../blocks/Token.vue'
import TokenBlock from '../blocks/TokenBlock.vue'
import LabelsBlock from '../blocks/LabelsBlock.vue'
import InfoBar from '../toolbars/InfoBar.vue'
import { TMToken, TMTokenBlock, type TMTokens } from '../managers/TokenManager'

export default {
  name: 'SharedEditorFunctions',
  components: {
    Token,
    TokenBlock,
    LabelsBlock,
    InfoBar
  },
  data() {
    return {
      TMToken,
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
      const processedBlocks = new Set(); // Track processed block IDs
      
      for (let i = 0; i < this.tokenManager.tokens.length; i++) {
        const t = this.tokenManager.tokens[i];
        if (t instanceof TMToken) {
          renderList.push(t);
        } else if (t instanceof TMTokenBlock) {
          // Skip if this block has already been processed
          if (processedBlocks.has(t.start)) {
            continue;
          }
          
          // Check for overlapping blocks
          const overlapping = this.tokenManager.isOverlapping(t.start, t.end);
          
          if (overlapping && overlapping.length > 1) {
            // For overlapping blocks, only show the latest suggested/accepted annotation
            // Hide rejected blocks that overlap with non-rejected blocks
            const activeBlocks = overlapping.filter(block => 
              block.currentState === 'Suggested' || 
              block.currentState === 'Candidate' || 
              block.currentState === 'Accepted'
            );
            
            if (activeBlocks.length > 0) {
              // Find the most recent active block based on history or state
              const mostRecentActive = activeBlocks.reduce((latest, current) => {
                // Prioritize 'Suggested' over 'Candidate', and by history length
                if (current.currentState === 'Suggested' && latest.currentState !== 'Suggested') {
                  return current;
                } else if (latest.currentState === 'Suggested' && current.currentState !== 'Suggested') {
                  return latest;
                } else {
                  // Both same state, compare by history length or position
                  return (current.history?.length || 0) >= (latest.history?.length || 0) ? current : latest;
                }
              });

              // Ensure the most recent active block has not already been added
              if (!processedBlocks.has(mostRecentActive.start)) {
                renderList.push(mostRecentActive);
              }
            } else {
              // If all blocks are rejected, still show one of them
              // The one to be shown should be the latest block (by history length, smallest number of entries)
              const latestRejected = overlapping.reduce((latest, current) => {
                return (current.history?.length || 0) <= (latest.history?.length || 0) ? current : latest;
              });
              renderList.push(latestRejected);
            }
            
            // Mark all overlapping blocks as processed
            overlapping.forEach(block => processedBlocks.add(block.start));
          } else {
            // Non-overlapping block - show it regardless of state
            renderList.push(t);
            processedBlocks.add(t.start);
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

      if (!selection?.rangeCount) {
        return
      }

      const range = selection.getRangeAt(0)

      const resolveTokenEl = (node: Node | null) => {
        if (!node) return null

        // Prefer a direct Element, otherwise fall back to its parent
        const el =
          node instanceof Element
            ? node
            : (node as unknown as { parentElement?: HTMLElement }).parentElement

        if (!el) return null
        if (typeof (el as HTMLElement).closest === 'function') {
          return (el as HTMLElement).closest('[id^="t"]') as HTMLElement | null
        }

        // For test doubles or non-Element parents without closest
        return (el as HTMLElement).id?.startsWith?.('t') ? (el as HTMLElement) : null
      }

      const findTokenByStart = (tokenStart: number): TMToken | null => {
        if (!this.tokenManager?.tokens) {
          return null
        }

        for (const token of this.tokenManager.tokens) {
          if (token instanceof TMToken && token.start === tokenStart) {
            return token
          }
          if (token instanceof TMTokenBlock) {
            const nested = token.tokens.find((t) => t.start === tokenStart)
            if (nested) {
              return nested
            }
          }
        }

        return null
      }

      const startEl = resolveTokenEl(range.startContainer)
      const endEl = resolveTokenEl(range.endContainer)

      let start, end
      try {
        const startIdx = startEl ? parseInt(startEl.id.replace('t', '')) : NaN
        const endIdx = endEl ? parseInt(endEl.id.replace('t', '')) : NaN

        if (Number.isNaN(startIdx) || Number.isNaN(endIdx)) {
          return
        }

        const startToken = findTokenByStart(startIdx)
        const endToken = findTokenByStart(endIdx)
        const startTokenLength = startToken ? startToken.end - startToken.start : 0
        const endTokenLength =
          endToken?.end && endToken?.start !== undefined
            ? endToken.end - endToken.start
            : endEl?.textContent?.length ?? 0

        const rangeStartOffset =
          range.startContainer && (range.startContainer as any).nodeType === Node.TEXT_NODE
            ? Math.min(range.startOffset, startTokenLength || range.startOffset)
            : 0
        const rangeEndOffset =
          range.endContainer && (range.endContainer as any).nodeType === Node.TEXT_NODE
            ? Math.min(range.endOffset, endTokenLength || range.endOffset)
            : endTokenLength

        start = startIdx + rangeStartOffset
        end = endIdx + rangeEndOffset
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
        // When overlapping in review mode, reject the existing blocks and create a new suggested one
        // In annotation mode, prompt for confirmation
        if (this.currentPage === 'review') {
          this.versionControlManager.addUndo(this.tokenManager)
          this.tokenManager.addNewBlock(
            start,
            end,
            this.labelManager.currentLabel,
            'Suggested',
            [],
          )
        } else {
          // Prompt to user to confirm overlapping blocks in annotation mode
          this.$q
            .dialog({
              title: 'Overlapping Annotations',
              message:
                'Your selection overlaps with existing annotations. Continuing will create a new annotation while preserving the existing ones. Do you want to proceed?',
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
        }
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
    /**
     * Determines if a token block should be visible in the UI
     * Rejected blocks that overlap with suggested blocks should be hidden
     * @param {TMTokenBlock} block - The token block to check
     * @returns {boolean} - Whether the block should be displayed
     */
    isBlockVisibleInUI(block) {
      // Always show non-rejected blocks
      if (block.currentState !== 'Rejected') {
        return true;
      }
      
      // For rejected blocks, check if they overlap with any suggested blocks
      const overlapping = this.tokenManager.isOverlapping(block.start, block.end);
      if (overlapping && overlapping.length > 1) {
        // If there's a suggested block in the same range, hide this rejected one
        const hasSuggestedOverlap = overlapping.some(b => 
          b !== block && (b.currentState === 'Suggested' || b.currentState === 'Candidate' || b.currentState === 'Accepted')
        );
        return !hasSuggestedOverlap;
      }
      
      // Show standalone rejected blocks
      return true;
    },
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
