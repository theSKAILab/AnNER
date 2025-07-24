import TokenManager, { TMTokenBlock } from './TokenManager.ts'

/**
 * UndoManager class for managing undo actions in the application.
 * @description This class provides functionality to manage undo actions, allowing users to revert changes made to the token manager.
 * @property {UndoAction[]} undoStack - An array of undo actions that can be performed.
 * @property {boolean} canUndo - A boolean indicating whether there are any actions that can be undone.
 */
export class UndoManager {
  private undoStack: UndoAction[] = []

  public get canUndo(): boolean {
    return this.undoStack.length > 0
  }

  /**
   * Add a new undo action to the stack.
   * @description This method adds a new action to the undo stack, which can later be undone.
   * @param {UndoAction} action - The action to be added to the undo stack.
   * @returns {void}
   */
  private add(action: UndoAction): void {
    this.undoStack.push(action)
  }

  /**
   * Undo the last action in the stack.
   * @description This method pops the last action from the undo stack and executes its callback.
   * @param {TokenManager} tokenManager - The TokenManager instance to apply the undo action to.
   * @returns {void}
   */
  public undo(tokenManager: TokenManager): void {
    const latestAction: UndoAction | undefined = this.undoStack.pop()
    if (latestAction) {
      latestAction.callback(tokenManager)
    }
  }

  /**
   * Undo all actions in the stack.
   * @description This method iterates through the undo stack and applies each action's callback, effectively reverting all changes made.
   * @param {TokenManager} tokenManager - The TokenManager instance to apply the undo actions to.
   * @returns {void}
   */
  public undoAll(tokenManager: TokenManager): void {
    while (this.undoStack.length > 0) {
      this.undo(tokenManager)
    }
  }

  /**
   * Add a create undo action to the stack.
   * @description This method creates a new delete action and adds it to the undo stack.
   * @param {number} start - The start index of the block to be deleted.
   * @returns {void}
   */
  public addCreateUndo(start: number) {
    const newAction: DeleteAction = new DeleteAction(start)
    this.add(newAction)
  }

  /**
   * Add a delete undo action to the stack.
   * @description This method creates a new create action and adds it to the undo stack.
   * @param {TMTokenBlock} block - The token block to be created.
   * @returns {void}
   */
  public addDeleteUndo(block: TMTokenBlock) {
    const newAction: CreateAction = new CreateAction(block.start, block)
    this.add(newAction)
  }

  /**
   * Add an update undo action to the stack.
   * @description This method creates a new update action and adds it to the undo stack.
   * @param {TMTokenBlock} block - The token block to be updated.
   * @returns {void}
   */
  public addUpdateUndo(block: TMTokenBlock) {
    const newAction: UpdateAction = new UpdateAction(block)
    this.add(newAction)
  }

  /**
   * Add an overlapping undo action to the stack.
   * @description This method creates a new overlapping action and adds it to the undo stack.
   * @param {TMTokenBlock[]} overlappingBlocks - An array of token blocks that overlap with the new block.
   * @param {number} newBlockStart - The start index of the new block that overlaps with existing blocks.
   * @returns {void}
   */
  public addOverlappingUndo(overlappingBlocks: TMTokenBlock[], newBlockStart: number) {
    const newAction: OverlappingAction = new OverlappingAction(overlappingBlocks, newBlockStart)
    this.add(newAction)
  }
}

/**
 * Abstract class representing an undo action.
 * @description This class serves as a base for all undo actions, providing a type and a callback method that must be implemented by subclasses.
 * @property {string} type - The type of the undo action.
 */
export abstract class UndoAction {
  static CreateAction: string = 'create'
  static DeleteAction: string = 'remove'
  static UpdateAction: string = 'update'
  static OverlappingAction: string = 'overlapping'

  public type: string

  constructor(type: string) {
    this.type = type
  }

  /**
   * Callback method to be implemented by subclasses.
   * @description This method is called when the undo action is executed, allowing subclasses to define their specific behavior.
   * @param {TokenManager} tokenManager - The TokenManager instance to apply the undo action to.
   * @returns {void}
   */
  abstract callback(tokenManager: TokenManager): void
}

/**
 * Class representing a create undo action.
 * @description This class extends UndoAction and implements the callback method to add a block to the TokenManager.
 * @property {string} type - The type of the undo action, set to 'create'.
 * @property {number} start - The start index of the block to be created.
 * @property {TMTokenBlock} block - The token block to be created.
 * @extends UndoAction
 */
export class CreateAction extends UndoAction {
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

/**
 * Class representing a delete undo action.
 * @description This class extends UndoAction and implements the callback method to remove a block from the TokenManager.
 * @property {string} type - The type of the undo action, set to 'remove'.
 * @property {number} start - The start index of the block to be deleted.
 * @extends UndoAction
 */
export class DeleteAction extends UndoAction {
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

/**
 * Class representing an update undo action.
 * @description This class extends UndoAction and implements the callback method to update a block in the TokenManager.
 * @property {string} type - The type of the undo action, set to 'update'.
 * @property {TMTokenBlock} block - The token block to be updated.
 * @extends UndoAction
 */
export class UpdateAction extends UndoAction {
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

/**
 * Class representing an overlapping undo action.
 * @description This class extends UndoAction and implements the callback method to handle overlapping blocks in the TokenManager.
 * @property {string} type - The type of the undo action, set to 'overlapping'.
 * @property {TMTokenBlock[]} overlappingBlocks - An array of token blocks that overlap with the new block.
 * @property {number} newBlockStart - The start index of the new block that overlaps with existing blocks.
 * @extends UndoAction
 */
export class OverlappingAction extends UndoAction {
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
