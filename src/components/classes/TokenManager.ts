import { Entity, History, Paragraph } from './AnnotationManager'
import { Label, LabelManager } from './LabelManager'

export interface TMTokens {
  start: number
  end: number
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

  public addNewBlock(
    start: number,
    end: number,
    labelClass: Label | undefined,
    currentState: string,
    history: History[] = []
  ): void {
    let selectionStart: number = end < start ? end : start
    let selectionEnd: number = end > start ? end : start
    
    const overlappedBlocks: TMTokens[] | null = this.isOverlapping(selectionStart, selectionEnd)
    
    // If there are any overlapping TMTokenBlocks, we need to handle that edge case
    // This will use the properties of the first returned block
    // to overwrite the properties of the new block
    if (overlappedBlocks) {
      overlappedBlocks.sort((a, b) => a.start - b.start)
      history = overlappedBlocks[0].history;
      
      for (const block of overlappedBlocks) {
        this.removeBlock(block.start, true) // Remove the block and reintroduce tokens (we will grab them later)
      }

      // We now need to adjust the selection start and end
      // to the first and last blocks in the overlapping blocks
      if (overlappedBlocks[0].start < selectionStart) {
        selectionStart = overlappedBlocks[0].start
      }
      if (overlappedBlocks[overlappedBlocks.length - 1].end > selectionEnd) {
        selectionEnd = overlappedBlocks[overlappedBlocks.length - 1].end
      }
    }
    
    const targetedBlocks: TMTokens[] = this.blocksInRange(selectionStart, selectionEnd);

    // Remove old blocks in prep for new blocks
    for (let i = 0; i < targetedBlocks.length; i++) {
      this.tokens = this.tokens.filter((token: TMTokens) => {
        return (token.start != targetedBlocks[i].start)
      })
    }

    // Go ahead and insert the new block now
    // If we overlapped, the overwrites of the blocks params will be passed in
    this.tokens.push(
      new TMTokenBlock(
        selectionStart,
        selectionEnd,
        targetedBlocks as TMToken[],
        labelClass as Label,
        currentState,
        false, // reviewed
        history,
      )
    )

    this.tokens.sort((a, b) => a.start - b.start)
  }

  public addBlockFromStructure(entity: Entity | TMTokenBlock): void {
    this.addNewBlock(
      entity.start,
      entity.end,
      entity.labelClass,
      entity.currentState || 'Candidate',
      entity.history || []
    )
    this.edited++
  }

  public removeBlock(start: number, reintroduceTokens: boolean = true): void {

    const targetBlock: TMTokens|null = this.getBlockByStart(start);

    // Verify that the block exists before proceeding
    if (targetBlock) {
      this.tokens = this.tokens.filter((token: TMTokens) => {
        return (token.start != start)
      })

      if (reintroduceTokens && (targetBlock instanceof TMTokenBlock)) {
        this.tokens.push(...targetBlock?.tokens);
      }

      this.edited++
      this.tokens.sort((a, b) => a.start - b.start);
    }
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
