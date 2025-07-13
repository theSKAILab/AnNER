import { Entity, History, Paragraph } from './AnnotationManager'
import { Label, LabelManager } from './LabelManager'

export interface TMTokens {
  start: number | undefined
  end: number | undefined
  currentState: string | undefined
  previousState?: string | undefined // Optional field for previous state in review mode
}

export class TMToken implements TMTokens {
  public type: string = 'token'
  public start: number
  public end: number
  public currentState: string
  public previousState?: string // Optional field for previous state in review mode

  public text: string

  constructor(start: number, end: number, text: string, currentState: string) {
    this.start = start
    this.end = end
    this.text = text
    this.currentState = currentState
  }

  public static fromObject(obj: object[]): TMToken {
    return new TMToken(obj[0], obj[1], obj[2], 'Candidate')
  }
}

export class TMTokenBlock implements TMTokens {
  public type: string = 'token-block' // Default type for token blocks
  public start: number
  public end: number
  public currentState: string
  public previousState?: string // Optional field for previous state in review mode

  public tokens: TMToken[]
  public labelClass: Label
  public reviewed: boolean
  public history: History[]

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
  }

  public exportAsEntity(): Entity {
    return new Entity(
      this.start, // Start index of the entity
      this.end, // End index of the entity
      this.history,
      this.labelClass,
      this.reviewed, // Indicates if the entity has been reviewed
    )
  }
}

export class TokenManager {
  public labelManager: LabelManager
  public tokens: TMTokens[] // Array of TMToken or TMTokenBlock objects
  public edited: number = 0 // Counter for edits
  public get tokenBlocks(): TMTokenBlock[] {
    return this.tokens.filter((token: TMTokens) => token instanceof TMTokenBlock) as TMTokenBlock[]
  }

  constructor(
    labelManager: LabelManager,
    tokens: object[],
    currentParagraph: Paragraph | null = null,
  ) {
    this.labelManager = labelManager
    this.tokens = tokens.map((t: object) => TMToken.fromObject(t))
    this.edited = 0
    if (currentParagraph) {
      // Reset previous annotation state
      currentParagraph.entities.forEach((entity: Entity) => {
        entity.labelClass = this.labelManager.getLabelByName(entity.labelName)
        this.addBlockFromStructure(entity)
      })
    }
  }

  public addNewBlock(
    start: number,
    end: number,
    labelClass: Label | undefined,
    currentState: string,
    history: History[] = [],
    runMode: string = 'annotate',
  ): void {
    const selectionStart: number = end < start ? end : start
    const selectionEnd: number = end > start ? end : start
    let overlappedBlock: TMTokens | null = null

    let selectedTokens: TMToken[] = []
    const newTokens: TMTokens[] = []

    for (let i: number = 0; i < this.tokens.length; i++) {
      const currentToken: TMTokens = this.tokens[i]
      if (currentToken.start >= selectionEnd && selectedTokens.length) {
        // We are outside of the selection, add the new block here
        newTokens.push(
          new TMTokenBlock(
            selectedTokens[0].start,
            selectedTokens[selectedTokens.length - 1].end,
            selectedTokens,
            labelClass,
            currentState,
            false, // reviewed
            history,
          ),
        )
        selectedTokens = []
        newTokens.push(currentToken)
      } else if (currentToken.start >= selectionStart && currentToken.end <= selectionEnd) {
        // Overlapping Selection
        // Token is inside the selection
        if (currentToken.type === 'token-block') {
          if (runMode == 'review') {
            currentToken.previousState = currentToken.currentState
            currentToken.currentState = currentState
            overlappedBlock = { ...currentToken }
            // Remove existing block
            this.removeBlock(currentToken.start)
            // Backup
            i--
          } else {
            this.removeBlock(currentToken.start) // Remove existing block
            i--
          }
        } else if (currentToken.type === 'token') {
          selectedTokens.push(currentToken)
        }
      } else {
        newTokens.push(currentToken)
      }
    }

    if (selectedTokens.length) {
      newTokens.push(
        new TMTokenBlock(
          selectedTokens[0].start,
          selectedTokens[selectedTokens.length - 1].end,
          selectedTokens,
          labelClass,
          currentState,
          false, // reviewed
          history,
        ),
      )
      selectedTokens = [] // Ensure selected tokens are cleared after use
    }

    // If there is an overlapped block and we are in review mode, add it back to the new tokens array
    if (overlappedBlock && runMode === 'review') {
      // Add the overlapped block back to the new tokens array
      newTokens.push(overlappedBlock)
    }

    // Update the tokens array with new tokens
    newTokens.sort((a, b) => a.start - b.start)
    this.tokens = newTokens
    this.edited++
  }

  public addBlockFromStructure(entity: Entity | TMTokenBlock): void {
    this.addNewBlock(
      entity.start,
      entity.end,
      entity.labelClass,
      entity.currentState || 'Candidate',
      entity.history || [],
      'annotate', // Default run mode
    )
    this.edited++
  }

  public removeBlock(start: number, reintroduceTokens: boolean = true): void {
    const newTokens: TMTokens[] = []
    for (let i = 0; i < this.tokens.length; i++) {
      // If there is a token block that is targeted for removal
      // Remove it and add the tokens back to the array
      // Note: Skip this step for instances like when undoing an overlapping block action
      if (this.tokens[i] instanceof TMTokenBlock && this.tokens[i].start == start) {
        if (reintroduceTokens) newTokens.push(...this.tokens[i].tokens)
      } else {
        newTokens.push(this.tokens[i])
      }
    }
    this.tokens = newTokens
    this.edited++
  }

  public removeDuplicateBlocks(): void {
    this.tokens = [...new Set(this.tokens.sort((a, b) => a.start - b.start))]
    this.edited++
  }

  public getBlockByStart(start: number): TMToken | null {
    for (let i = 0; i < this.tokens.length; i++) {
      const token: TMTokens = this.tokens[i]
      if (token.type === 'token-block' && token.start === start) {
        return token
      }
    }
    return null
  }

  public isOverlapping(start: number, end: number): TMTokens[] | null {
    const overlappingBlocks: TMTokens[] = []

    for (let i = 0; i < this.tokens.length; i++) {
      const currentToken: TMTokens = this.tokens[i]
      if (currentToken.type === 'token-block') {
        if (
          (start >= currentToken.start && start <= currentToken.end) ||
          (end >= currentToken.start && end <= currentToken.end)
        ) {
          overlappingBlocks.push(currentToken)
        }
      }
    }

    return overlappingBlocks.length > 0 ? overlappingBlocks : null
  }
}

export default TokenManager
