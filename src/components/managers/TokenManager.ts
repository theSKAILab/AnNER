import { Entity, History, Paragraph } from './AnnotationManager'
import { Label, LabelManager } from './LabelManager'
import type { TokenizerSpans } from '@/components/types/Tokenizer'

/**
 * Interface for TokenManager tokens.
 * @description This interface defines the structure for tokens used in the TokenManager.
 * @property {number} start - The start index of the token.
 * @property {number} end - The end index of the token.
 * @property {string | undefined} currentState - The current state of the token, can be undefined.
 */
export interface TMTokens {
  start: number
  end: number
  currentState: string | undefined
}

/**
 * Class representing a token in the TokenManager.
 * @description This class implements the TMTokens interface and represents a token with its start, end, text, and current state.
 * @property {string} type - The type of the token, default is 'token'.
 * @property {number} start - The start index of the token.
 * @property {number} end - The end index of the token.
 * @property {string} currentState - The current state of the token.
 * @property {string} text - The text of the token.
 */
export class TMToken implements TMTokens {
  public type: string = 'token'
  public start: number
  public end: number
  public currentState: string

  public text: string

  /**
   * Constructor for TMToken.
   * @constructor
   * @param {number} start - The start index of the token.
   * @param {number} end - The end index of the token.
   * @param {string} text - The text of the token.
   * @param {string} currentState - The current state of the token.
   */
  constructor(start: number, end: number, text: string, currentState: string) {
    this.start = start
    this.end = end
    this.text = text
    this.currentState = currentState
  }

  /**
   * Static method to create a TMToken from a TokenizerSpans object.
   * @param {TokenizerSpans} obj - The TokenizerSpans object to convert.
   * @returns {TMToken} - A new TMToken instance.
   */
  public static fromObject(obj: TokenizerSpans): TMToken {
    return new TMToken(obj[0], obj[1], obj[2], 'Candidate')
  }
}

/**
 * Class representing a block of tokens in the TokenManager.
 * @description This class implements the TMTokens interface and represents a block of tokens with its start, end, label class, current state, and history.
 * @property {string} type - The type of the token block, default is 'token-block'.
 * @property {number} start - The start index of the token block.
 * @property {number} end - The end index of the token block.
 * @property {TMToken[]} tokens - An array of TMToken objects representing the tokens in the block.
 * @property {Label} labelClass - The label class associated with the token block.
 * @property {string} currentState - The current state of the token block.
 * @property {boolean} reviewed - Indicates if the token block has been reviewed.
 * @property {History[]} history - An array of history entries for the token block.
 * @property {TMTokenBlock} originalState - The original state of the token block, used for restoring the block's state.
 */
export class TMTokenBlock implements TMTokens {
  public type: string = 'token-block' // Default type for token blocks
  public start: number
  public end: number
  public currentState: string

  public tokens: TMToken[]
  public labelClass: Label
  public reviewed: boolean
  public history: History[]
  public originalState: TMTokenBlock

  /**
   * Constructor for TMTokenBlock.
   * @description The constructor initializes the token block with the provided parameters and sets the original state to the current state.
   * @constructor
   * @param {number} start - The start index of the token block.
   * @param {number} end - The end index of the token block.
   * @param {TMToken[]} tokens - An array of TMToken objects representing the tokens in the block.
   * @param {Label} labelClass - The label class associated with the token block.
   * @param {string} currentState - The current state of the token block.
   * @param {boolean} reviewed - Indicates if the token block has been reviewed, default is false.
   * @param {History[]} history - An array of history entries for the token block, default is an empty array.
   * @returns {void}
   */
  constructor(
    start: number,
    end: number,
    tokens: TMToken[],
    labelClass: Label,
    currentState: string,
    reviewed: boolean = false,
    history: History[] = [],
  ) {
    this.start = start
    this.end = end
    this.tokens = tokens
    this.labelClass = labelClass
    this.currentState = currentState
    this.reviewed = reviewed
    this.history = history
    this.originalState = { ...this }
  }

  /**
   * Method to create a TMTokenBlock from an Entity object.
   * @returns {TMTokenBlock} - A new TMTokenBlock instance.
   */
  public exportAsEntity(): Entity {
    return new Entity(
      this.start, // Start index of the entity
      this.end, // End index of the entity
      this.history,
      this.labelClass,
      this.reviewed, // Indicates if the entity has been reviewed
      this.currentState, // Current state of the entity
    )
  }

  /**
   * Restore the original state of the token block.
   * @description This method restores the token block to its original state, including its start, end, tokens, history, label class, current state, and reviewed status.
   * @returns {void}
   */
  public restoreOriginalState(): void {
    // Should not need to restore these properties as they are not modified
    // this.start = this.originalState.start
    // this.end = this.originalState.end
    // this.tokens = this.originalState.tokens
    // this.history = this.originalState.history
    this.labelClass = this.originalState.labelClass
    this.currentState = this.originalState.currentState
    this.reviewed = this.originalState.reviewed
  }
}

/**
 * Class representing the TokenManager.
 * @description This class manages tokens and token blocks, allowing for operations such as adding, removing, and updating blocks.
 * @property {LabelManager} labelManager - The label manager associated with the TokenManager.
 * @property {TMTokens[]} tokens - An array of tokens or token blocks managed by the TokenManager.
 * @property {number} edited - A counter for the number of edits made to the tokens.
 * @property {TMTokenBlock[]} tokenBlocks - An array of TMTokenBlock objects derived from the tokens.
 */
export class TokenManager {
  public labelManager: LabelManager
  public tokens: TMTokens[] // Array of TMToken or TMTokenBlock objects
  public edited: number = 0 // Counter for edits

  public get tokenBlocks(): TMTokenBlock[] {
    return this.tokens.filter((token: TMTokens) => token instanceof TMTokenBlock) as TMTokenBlock[]
  }

  /**
   * Constructor for TokenManager.
   * @description The constructor initializes the TokenManager with a LabelManager and an array of tokens.
   * @param {LabelManager} labelManager - The label manager associated with the TokenManager.
   * @param {TokenizerSpans[]} tokens - An array of TokenizerSpans objects to initialize the tokens.
   * @param {Paragraph | null} currentParagraph - The current paragraph
   */
  constructor(
    labelManager: LabelManager,
    tokens: TokenizerSpans[],
    currentParagraph: Paragraph | null = null,
  ) {
    this.labelManager = labelManager
    this.tokens = tokens.map((t: TokenizerSpans) => TMToken.fromObject(t))
    this.edited = 0
    if (currentParagraph) {
      // Reset previous annotation state
      currentParagraph.entities.forEach((entity: Entity) => {
        entity.labelClass = this.labelManager.getLabelByName(entity.labelName ?? entity.labelClass?.name)
        this.addBlockFromStructure(entity)
      })
    }
  }

  /**
   * Gets all blocks in the specified range.
   * @description This method retrieves all blocks that overlap with the specified start and end indices.
   * @param {number} start - The start index of the range.
   * @param {number} end - The end index of the range.
   * @returns {TMTokens[]} - An array of TMTokens that overlap with the specified range.
   */
  public blocksInRange(start: number, end: number): TMTokens[] {
    const blocks: TMTokens[] = []
    for (let i = 0; i < this.tokens.length; i++) {
      const token: TMTokens = this.tokens[i]
      if (
        (token.start >= start && token.start <= end) ||
        (token.end >= start && token.end <= end) ||
        (token.start <= start && token.end >= end)
      ) {
        blocks.push(token)
      }
    }
    return blocks
  }

  /**
   * Adds a new block of tokens to the TokenManager.
   * @description This method adds a new block of tokens, handling overlapping blocks and updating the tokens array accordingly.
   * @param {number} start - The start index of the new block.
   * @param {number} end - The end index of the new block.
   * @param {Label | undefined} labelClass - The label class for the new block, can be undefined.
   * @param {string} currentState - The current state of the new block.
   * @param {History[]} [history=[]] - An optional array of history entries for the new block.
   * @returns {void}
   */
  public addNewBlock(
    start: number,
    end: number,
    labelClass: Label | undefined,
    currentState: string,
    history: History[] = [],
    manualState: boolean = false
  ): void {
    const selectionStart: number = end < start ? end : start
    const selectionEnd: number = end > start ? end : start

    const overlappedBlocks: TMTokens[] | null = this.isOverlapping(selectionStart, selectionEnd)

    // If there are overlapping blocks, mark them as rejected and collect their tokens
    // for inclusion in the new suggested annotation
    if (overlappedBlocks) {
      overlappedBlocks.sort((a, b) => a.start - b.start)

      // Step 1: Mark overlapping blocks as rejected and remove them from tokens array
      for (const block of overlappedBlocks) {
        if (!manualState) {
          block.currentState = 'Rejected' // Set overlapped blocks to Rejected
          if (block instanceof TMTokenBlock) {
            block.reviewed = true // Mark as reviewed to preserve in export
          }
        }
        // Remove the overlapped block from tokens array temporarily
        this.tokens = this.tokens.filter((token: TMTokens) => {
          return token.start != block.start
        })
        // Reintroduce individual tokens from the overlapped block
        if (block instanceof TMTokenBlock) {
          this.tokens.push(...block.tokens)
        }
        this.tokens.sort((a, b) => a.start - b.start)
      }
    }

    const targetedBlocks: TMTokens[] = this.blocksInRange(selectionStart, selectionEnd)

    // Remove old blocks in prep for new blocks
    for (let i = 0; i < targetedBlocks.length; i++) {
      this.tokens = this.tokens.filter((token: TMTokens) => {
        return token.start != targetedBlocks[i].start
      })
    }

    // Go ahead and insert the new block now
    // If we overlapped, the overwrites of the blocks params will be passed in
    this.tokens.push(
      new TMTokenBlock(
        selectionStart,
        targetedBlocks[targetedBlocks.length - 1].end,
        targetedBlocks as TMToken[],
        labelClass as Label,
        currentState,
        false, // reviewed
        history,
      ),
    )

    // Reinsert original overlapped blocks if any (now marked as Rejected)
    if (overlappedBlocks) {
      for (const block of overlappedBlocks) {
        if (block instanceof TMTokenBlock) {
          this.tokens.push(block)
        }
      }
    }

    this.tokens.sort((a, b) => a.start - b.start)

    // Remove individual tokens that are covered by any token block
    const tokenBlocks = this.tokens.filter(token => token instanceof TMTokenBlock) as TMTokenBlock[]
    this.tokens = this.tokens.filter(token => {
      if (token instanceof TMTokenBlock) {
        return true // Keep all token blocks
      }
      // Remove individual tokens that are covered by any token block
      return !tokenBlocks.some(block => 
        token.start >= block.start && token.end <= block.end
      )
    })
  }

  /**
   * Adds a block from an Entity or TMTokenBlock structure.
   * @description This method adds a new block to the TokenManager from an Entity or TMTokenBlock structure.
   * @param {Entity | TMTokenBlock} entity - The Entity or TMTokenBlock structure to add.
   * @returns {void}
   */
  public addBlockFromStructure(entity: Entity | TMTokenBlock): void {
    this.addNewBlock(
      entity.start,
      entity.end,
      entity.labelClass,
      entity.currentState || 'Candidate',
      entity.history || [],
      true // Since we are directly importing the block, do not calculate the state
    )
    this.edited++
  }

  /**
   * Removes a block of tokens by its start index.
   * @description This method removes a block of tokens from the TokenManager by its start index.
   * @param {number} start - The start index of the block to remove.
   * @param {boolean} [reintroduceTokens=true] - Whether to reintroduce the tokens from the removed block back into the tokens array.
   * @returns {void}
   */
  public removeBlock(start: number, reintroduceTokens: boolean = true): void {
    const targetBlock: TMTokens | null = this.getBlockByStart(start)

    // Verify that the block exists before proceeding
    if (targetBlock) {
      this.tokens = this.tokens.filter((token: TMTokens) => {
        return token.start != start
      })

      if (reintroduceTokens && targetBlock instanceof TMTokenBlock) {
        this.tokens.push(...targetBlock?.tokens)
      }

      this.edited++
      this.tokens.sort((a, b) => a.start - b.start)
    }
  }

  /**
   * Gets a block by its start index.
   * @description This method retrieves a block from the tokens array by its start index.
   * @param {number} start - The start index of the block to retrieve.
   * @returns {TMTokenBlock | null} - The block if found, otherwise null
   */
  public getBlockByStart(start: number): TMTokenBlock | null {
    for (let i = 0; i < this.tokens.length; i++) {
      const token: TMTokens = this.tokens[i]
      if (token instanceof TMTokenBlock && token.start === start) {
        return token
      }
    }
    return null
  }

  /**
   * Checks if there are any overlapping blocks in the specified range.
   * @description This method checks if there are any blocks that overlap with the specified start and end indices.
   * @param {number} start - The start index of the range.
   * @param {number} end - The end index of the range.
   * @returns {TMTokens[] | null} - An array of overlapping blocks if found, otherwise null.
   */
  public isOverlapping(start: number, end: number): TMTokens[] | null {
    const overlappingBlocks: TMTokens[] = []

    for (let i = 0; i < this.tokens.length; i++) {
      const currentToken: TMTokens = this.tokens[i]
      if (currentToken instanceof TMTokenBlock) {
        if (
          (start >= currentToken.start && start <= currentToken.end) ||
          (end >= currentToken.start && end <= currentToken.end) ||
          (currentToken.start >= start && currentToken.end <= end)
        ) {
          overlappingBlocks.push(currentToken)
        }
      }
    }

    return overlappingBlocks.length > 0 ? overlappingBlocks : null
  }

  /**
   * Restores the original state of a block by its start index.
   * @description This method restores the original state of a block by its start index, resetting its properties to their original values.
   * @param {number} start - The start index of the block to restore.
   * @returns {void}
   */
  public restoreOriginalBlockState(start: number): void {
    const targetBlock: TMTokenBlock | null = this.getBlockByStart(start)

    // Verify that the block exists before proceeding
    if (targetBlock) {
      targetBlock.restoreOriginalState()
      this.edited++
    }
  }
}

export default TokenManager
