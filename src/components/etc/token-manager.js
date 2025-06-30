class TokenManager {
  /**
   *
   * @param {Array} tokens
   */
  constructor(classes) {
    this.classes = classes
    this.tokens = []; // Initialize tokens array
    this.rejectedAnnotations = []; // Initialize rejected annotations array
  }

  setTokensAndAnnotation(tokens, currentAnnotation) {
    // Initialize tokens with provided annotation data
    this.tokens = tokens.map((t) => ({
      type: "token",
      start: t[0],
      end: t[1],
      text: t[2],
      currentState: "Candidate",
    }));
    this.words = tokens.map(t => t[2]);
    if (currentAnnotation != undefined) {
      // reset previous annotation state
      for (let i = 0; i < currentAnnotation.entities.length; i++) {
        var annotation = currentAnnotation.entities[i];

        annotation.labelClass = this.classes.find(c => c.name == annotation.labelClass.name) || {"name": annotation.labelClass.name};
        this.addBlockFromBlock(annotation);
      }
    }
  }

  // Todo if there is a block somewhere in the middle of the range, return it
  isOverlapping(start, end) {
    var overlappingBlocks = [];

    for (let i = 0; i < this.tokens.length; i++) {
      let currentToken = this.tokens[i];
      if (currentToken.type === "token-block") {
        if (
          (
            (start >= currentToken.start && start <= currentToken.end) || 
            (end >= currentToken.start && end <= currentToken.end)
          )
          ) {
              overlappingBlocks.push(currentToken);
            }
      }
    }
    return overlappingBlocks.length > 0? overlappingBlocks : null;
  }

  addBlockFromBlock(block) {
    this.addNewBlock(
      block.start,
      block.end,
      block.labelClass,
      block.currentState,
      "annotate", // this field does not matter here as the block already has the data required
      block.history,
    )
  }

  /**
   * Creates a new token block with the tokens whose starts match the input
   * parameters
   *
   * @param {Number} _start 'start' value of the token forming the start of the token block
   * @param {Number} _end 'start' value of the token forming the end of the token block
   * @param {Number} _class the id of the class to highlight
   * @param {Boolean} isHumanOpinion Separate nlp vs human made annotation
   */
  addNewBlock(_start, _end, _class, currentState = "Candidate", page = "annotate", history = []) {
    // Directly apply humanOpinion to the block structure
    let selectedTokens = [];
    let newTokens = [];

    let selectionStart = _end < _start ? _end : _start;
    let selectionEnd = _end > _start ? _end : _start;

    let overlappedBlock = null;

    for (let i = 0; i < this.tokens.length; i++) {
      let currentToken = this.tokens[i];
      if (currentToken.start >= selectionEnd && selectedTokens.length) {
        // token is first after the selection
        appendNewBlock(selectedTokens, _class, newTokens, history); // Append selected tokens with updated attributes
        selectedTokens = []; // Ensure selected tokens are cleared after use
        newTokens.push(currentToken);
      } else if (currentToken.end >= selectionStart && currentToken.start < selectionEnd) {
        // overlapping selection
        // token is inside the selection
        if (currentToken.type == "token-block") {
          if (page == "review") {
            // Save what was the existing block before stripping it
            currentToken.previousState = currentToken.currentState;
            currentToken.currentState = "Rejected";
            overlappedBlock = {...currentToken};
            // Remove existing block
            this.removeBlock(currentToken.start);

            // Backup
            i--
          } else {
            this.removeBlock(currentToken.start);
            i--
          }
        } else if (currentToken.type == "token") {
          selectedTokens.push(currentToken);
        }

        // add logic to add block to page if the end of it is the end of the tokens
      } else {
        newTokens.push(currentToken);
      }
    }

    if (selectedTokens.length) {
      appendNewBlock(selectedTokens, _class, newTokens, history); // Append selected tokens with updated attributes
      selectedTokens = []; // Ensure selected tokens are cleared after use
      //newTokens.push(currentToken);
    }

    // If there is an overlapped block and we are in review page, add it back to the new tokens array
    if (overlappedBlock && page == "review") {
      // Add the overlapped block back to the new tokens array
      newTokens.push(overlappedBlock);
    }

    // Update the tokens array with new tokens
    newTokens = newTokens.sort((a, b) => a.start - b.start);
    this.tokens = newTokens;
    function appendNewBlock(tokens, _class, tokensArray, history) {
      if (tokens.length) {
        let newBlock = {
          type: "token-block",
          start: tokens[0].start,
          end: tokens[tokens.length - 1].end,
          tokens: tokens,
          labelClass: _class,
          currentState: currentState,
          reviewed: false,
          history: history
        };
        tokensArray.push(newBlock);
      }
    }
  }

  /**
   * Removes a token block and puts back all the tokens in their original position
   *
   * @param {Number} blockStart 'start' value of the token block to remove
   */
  removeBlock(blockStart, reintroduceTokens = true) {
    let newTokens = [];
    for (let i = 0; i < this.tokens.length; i++) {
      // If there is a token block that is targeted for removal
      // Remove it and add the tokens back to the array
      // Note: Skip this step for instances like when undoing an overlapping block action
      if (
        this.tokens[i].type === "token-block" &&
        this.tokens[i].start === blockStart
      ) {
        if (reintroduceTokens) newTokens.push(...this.tokens[i].tokens);
      } else {
        newTokens.push(this.tokens[i]);
      }
    }
    this.tokens = newTokens;
  }

  /**
   * Exports the tokens and the token blocks as annotations
   */
  exportAsAnnotation() {
    let entities = [];
    for (let i = 0; i < this.tokens.length; i++) {
      if (this.tokens[i].type === "token-block") {
        let b = this.tokens[i];
        const historyEntry = {
          start: b.start,
          end: b.end,
          history: b.history,
          currentState: b.currentState,
          labelClass: b.labelClass,
          reviewed: b.reviewed,
        }
        entities.push(historyEntry);
      }
    }
    return entities.sort((a, b) => a.start - b.start);
  }

  // Returns a token-block given its starting index, else returns null
  getBlockByStart(start) {
    for (let i = 0; i < this.tokens.length; i++) {
      const token = this.tokens[i];
      if (token.type === "token-block" && token.start === start) {
        return token;
      }
    }

    return null;
  }

  removeDuplicateBlocks() {
    this.tokens = [...new Set(this.tokens.sort((a, b) => a.start - b.start))];
  }
}

export default TokenManager;