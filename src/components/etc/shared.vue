<script>
import { mapMutations, mapState } from "vuex";
import TokenManager from "../etc/token-manager";

export default {
  name: "SharedEditorFunctions",
  data: function () {
    return {
      tm: new TokenManager([]),
    };
  },
  watch: {
    tm: {
      handler() {
        this.save();
      },
      deep: true,
    }
  },
  computed: {
    ...mapState(["currentPage"])
  },
  methods: {
    ...mapMutations(["nextSentence", "previousSentence", "resetIndex", "addUndoCreate", "addUndoDelete", "addUndoOverlapping"]),
    undo() {
        if (this.undoStack.length > 0) {
            const lastAction = this.undoStack.pop();
            console.log("Undoing action:", lastAction);
            switch (lastAction.type) {
            case 'remove':
              this.tm.removeBlock(lastAction.start);
              break;
            case 'create':
              this.tm.addBlockFromBlock(lastAction.oldBlock);
              break;
            case 'update':
              this.tm.removeBlock(lastAction.oldBlock.start);
              this.tm.addBlockFromBlock(lastAction.oldBlock);
              break;
            case 'overlapping':
              console.log(lastAction)
              // Gross fix
              // Basically remove all of the mentioned blocks and add them back with their previous state
              for(var i = 0; i < lastAction.overlappingBlocks.length; i++) {
                this.tm.removeBlock(lastAction.overlappingBlocks[i].start);
              }
              this.tm.removeBlock(lastAction.newBlockStart, true);
              // Add the old blocks back
              console.log(this.tm.tokens)
              this.tm.removeDuplicateBlocks();
              for(i = 0; i < lastAction.overlappingBlocks.length; i++) {
                this.tm.addNewBlock(lastAction.overlappingBlocks[i].start, lastAction.overlappingBlocks[i].end, lastAction.overlappingBlocks[i].labelClass, lastAction.overlappingBlocks[i].previousState, this.currentPage);
              }
              break;
            }
            this.save();
        }
    },
    undoAll() {
        while(this.undoStack.length > 0) { this.undo();}
        this.save();
    },
        /**
     * Tokenizes the current sentence and sets the TokenManager
     */
    tokenizeCurrentSentence() {
      this.currentSentence = this.inputSentences[this.currentIndex];
      this.currentAnnotation = this.annotations[this.currentIndex];

      let tokens = this.tokenizer.tokenize(this.currentSentence.text);
      let spans = this.tokenizer.span_tokenize(this.currentSentence.text);

      let combined = tokens.map((t, i) => [spans[i][0], spans[i][1], t]);
      this.tm = new TokenManager(this.classes);
      this.tm.setTokensAndAnnotation(combined, this.currentAnnotation);
    },
    /**
     * Adds a new block to the TokenManager based on the current selection
     */
    selectTokens() {
      let selection = document.getSelection();
      if (selection.anchorOffset === selection.focusOffset && selection.anchorNode === selection.focusNode) {return; }

      const rangeStart = selection.getRangeAt(0);
      const rangeEnd = selection.getRangeAt(selection.rangeCount - 1);
      
      let start, end;
      try {
        start = parseInt(rangeStart.startContainer.parentElement.id.replace("t", ""));
        let offsetEnd = parseInt(rangeEnd.endContainer.parentElement.id.replace("t", ""));
        end = offsetEnd + rangeEnd.endOffset;
      } catch {
        return;
      }

      // No classes available to tag
      if (!this.classes.length && selection.anchorNode) {
        this.$q.dialog({
          title: 'No Tags Available',
          message: 'Please add some Tags before tagging.',
        })
        selection.empty();
        return;
      }
      
      // Attempt to create a new block
      
      // Determine if the selection will overlap with an existing block and add to undo stack accordingly
      var existingBlocks = this.tm.isOverlapping(start, end);
      if (existingBlocks) {
        this.addUndoOverlapping({"oldBlocks": existingBlocks, "newBlockStart": start});
        this.tm.addNewBlock(start, end, this.currentClass, "Suggested", this.currentPage);
      } else {
        this.tm.addNewBlock(start, end, this.currentClass, this.currentPage == "annotate"? "Candidate": "Suggested", this.currentPage);
        if (this.tm.getBlockByStart(start)) this.addUndoCreate(this.tm.getBlockByStart(start));
      }

      selection.empty();
      this.save();
    },
    // Callbacks for Token and TokenBlock components
    /**
     * Removes TokenBlock from the TokenManager
     * @param {Number} blockStart - The start position of the block to remove
     */
    onRemoveBlock(blockStart) {
      this.addUndoDelete(this.tm.getBlockByStart(blockStart));
      this.tm.removeBlock(blockStart);
      this.save();
    },
    /**
     * Saves the current annotation to the store
     */
    save() {
      this.$store.commit("addAnnotation", {
        text: this.currentSentence.text,
        entities: this.tm.exportAsAnnotation(),
      });
    },
    beforeLeave() {
      return "Leaving this page will discard any unsaved changes.";
    }
  },
}

</script>