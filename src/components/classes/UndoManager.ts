import TokenManager, { TMTokenBlock } from './TokenManager.ts'

export class UndoManager {
  private undoStack: UndoAction[] = []

  public get canUndo(): boolean {
    return this.undoStack.length > 0
  }

  constructor() {}

  private add(action: UndoAction): void {
    this.undoStack.push(action)
  }

  public undo(tokenManager: TokenManager): void {
    console.log('Undoing last action')
    if (this.undoStack.length) {
      const latestAction: UndoAction = this.undoStack.pop()
      latestAction.callback(tokenManager)
      console.log(tokenManager)
    }
  }

  public undoAll(tokenManager: TokenManager): void {
    while (this.undoStack.length > 0) {
      this.undo(tokenManager)
    }
  }

  public addCreateUndo(start: number) {
    const newAction: UndoAction = new UndoAction(UndoAction.DeleteAction, start)
    this.add(newAction)
  }

  public addDeleteUndo(block: TMTokenBlock) {
    const newAction: UndoAction = new UndoAction(UndoAction.CreateAction, undefined, block)
    this.add(newAction)
  }

  public addUpdateUndo(block: TMTokenBlock) {
    const newAction: UndoAction = new UndoAction(UndoAction.UpdateAction, undefined, block)
    this.add(newAction)
  }

  public addOverlappingUndo(overlappingBlocks: TMTokenBlock[], newBlockStart: number) {
    const newAction: UndoAction = new UndoAction(
      UndoAction.OverlappingAction,
      newBlockStart,
      overlappingBlocks,
    )
    this.add(newAction)
  }
}

class UndoAction {
  // Inverse
  // i.e create -> delete, delete -> create, update -> update, overlapping -> overlapping
  static CreateAction: string = 'create'
  static DeleteAction: string = 'remove'
  static UpdateAction: string = 'update'
  static OverlappingAction: string = 'overlapping'

  public type: string
  public block: TMTokenBlock | TMTokenBlock[] | null = null
  public start: number | null = null

  constructor(type: string, start?: number, block?: TMTokenBlock | TMTokenBlock[]) {
    this.type = type
    if (block) this.block = block
    if (start) this.start = start
  }

  public callback(tokenManager: TokenManager): void {
    console.log(this, tokenManager)
    switch (this.type) {
      case UndoAction.CreateAction:
        tokenManager.addBlockFromStructure(this.block as TMTokenBlock)
        break
      case UndoAction.UpdateAction:
        const oldBlock: TMTokenBlock = this.block as TMTokenBlock
        tokenManager.removeBlock(oldBlock.start)
        tokenManager.addBlockFromStructure(this.block as TMTokenBlock)
        break
      case UndoAction.DeleteAction:
        tokenManager.removeBlock(this.start as number)
        break
      case UndoAction.OverlappingAction:
        const overlappingBlocks: TMTokenBlock[] = this.block as TMTokenBlock[]
        for (let i = 0; i < overlappingBlocks.length; i++) {
          tokenManager.removeBlock(overlappingBlocks[i].start, false)
        }
        tokenManager.removeBlock(this.overlappingStart as number, true)
        // Add the old blocks back
        for (let i = 0; i < overlappingBlocks.length; i++) {
          tokenManager.addBlockFromStructure(overlappingBlocks[i]) // DEPARTURE FROM PREVIOUS
        }
        break
    }
  }
}
