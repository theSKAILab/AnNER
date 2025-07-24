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
    const latestAction: UndoAction | undefined = this.undoStack.pop()
    if (latestAction) {
      latestAction.callback(tokenManager)
    }
  }

  public undoAll(tokenManager: TokenManager): void {
    while (this.undoStack.length > 0) {
      this.undo(tokenManager)
    }
  }

  public addCreateUndo(start: number) {
    const newAction: DeleteAction = new DeleteAction(start)
    this.add(newAction)
  }

  public addDeleteUndo(block: TMTokenBlock) {
    const newAction: CreateAction = new CreateAction(block.start, block)
    this.add(newAction)
  }

  public addUpdateUndo(block: TMTokenBlock) {
    const newAction: UpdateAction = new UpdateAction(block)
    this.add(newAction)
  }

  public addOverlappingUndo(overlappingBlocks: TMTokenBlock[], newBlockStart: number) {
    const newAction: OverlappingAction = new OverlappingAction(overlappingBlocks, newBlockStart)
    this.add(newAction)
  }
}

abstract class UndoAction {
  static CreateAction: string = 'create'
  static DeleteAction: string = 'remove'
  static UpdateAction: string = 'update'
  static OverlappingAction: string = 'overlapping'

  public type: string

  constructor(type: string) {
    this.type = type
  }

  abstract callback(tokenManager: TokenManager): void
}

class CreateAction extends UndoAction {
  type: string = UndoAction.CreateAction
  private start: number
  private block: TMTokenBlock

  constructor(start: number, block: TMTokenBlock) {
    super(UndoAction.CreateAction)
    this.start = start
    this.block = block
  }

  callback(tokenManager: TokenManager): void {
    tokenManager.addBlockFromStructure(this.block)
  }
}

class DeleteAction extends UndoAction {
  type: string = UndoAction.DeleteAction
  private start: number

  constructor(start: number) {
    super(UndoAction.DeleteAction)
    this.start = start
  }

  callback(tokenManager: TokenManager): void {
    tokenManager.removeBlock(this.start)
  }
}

class UpdateAction extends UndoAction {
  type: string = UndoAction.UpdateAction
  private block: TMTokenBlock

  constructor(block: TMTokenBlock) {
    super(UndoAction.UpdateAction)
    this.block = block
  }

  callback(tokenManager: TokenManager): void {
    tokenManager.removeBlock(this.block.start)
    tokenManager.addBlockFromStructure(this.block)
  }
}

class OverlappingAction extends UndoAction {
  type: string = UndoAction.OverlappingAction
  private overlappingBlocks: TMTokenBlock[]
  private newBlockStart: number

  constructor(overlappingBlocks: TMTokenBlock[], newBlockStart: number) {
    super(UndoAction.OverlappingAction)
    this.overlappingBlocks = overlappingBlocks
    this.newBlockStart = newBlockStart
  }

  callback(tokenManager: TokenManager): void {
    let earliestStart: number | null = null

    if (this.newBlockStart < this.overlappingBlocks[0].start) {
      earliestStart = this.newBlockStart
    } else {
      earliestStart = this.overlappingBlocks[0].start
    }
    tokenManager.removeBlock(earliestStart, true)
    // Add the old blocks back
    for (const block of this.overlappingBlocks) {
      tokenManager.addBlockFromStructure(block)
    }
  }
}
