import { Store } from 'vuex'
import { TokenManager, type TMTokens, TMToken, TMTokenBlock } from './TokenManager'

/**
 * Interface for state snapshots captured by the VersionControlManager.
 * @description This interface defines the structure for state snapshots that can be restored.
 */
interface StateSnapshot {
  tokenManagerState: TMTokens[]
  currentIndex: number
  edited: number
  timestamp: number
  tokenManagers?: SerializedTokenManager[]
}

/**
 * Interface for serialized TokenManager state.
 * @description Used to serialize and restore complete TokenManager instances.
 */
interface SerializedTokenManager {
  tokens: TMTokens[]
  edited: number
}

/**
 * Enhanced VersionControlManager class for managing undo/redo operations with Vuex integration.
 * @description This class provides comprehensive undo/redo functionality using state snapshots,
 * supporting both individual TokenManager operations and global store state changes.
 */
export class VersionControlManager {
  private undoStack: StateSnapshot[] = []
  private redoStack: StateSnapshot[] = []
  private maxStackSize: number = 50
  private store?: Store<{
    currentIndex: number
    tokenManager: TokenManager | null
    tokenManagers: TokenManager[] | null
  }>

  public get canUndo(): boolean {
    return this.undoStack.length > 0
  }

  public get canRedo(): boolean {
    return this.redoStack.length > 0
  }

  /**
   * Initialize the VersionControlManager with a reference to the Vuex store.
   * @param store - The Vuex store instance
   */
  public setStore(store: Store<{ currentIndex: number; tokenManager: TokenManager | null; tokenManagers: TokenManager[] | null }>): void {
    this.store = store
  }

  /**
   * Get the number of undo operations available.
   * @returns The number of states in the undo stack
   */
  public getUndoCount(): number {
    return this.undoStack.length
  }

  /**
   * Get the number of redo operations available.
   * @returns The number of states in the redo stack
   */
  public getRedoCount(): number {
    return this.redoStack.length
  }

  /**
   * Set the maximum stack size for undo/redo operations.
   * @param size - The maximum number of states to keep in memory
   */
  public setMaxStackSize(size: number): void {
    this.maxStackSize = size
    this.trimStack()
  }

  /**
   * Clear all undo/redo history.
   */
  public clearHistory(): void {
    this.undoStack = []
    this.redoStack = []
  }

  /**
   * Capture the current state before making changes.
   * @description This method should be called before any operation that modifies the TokenManager state.
   * @param tokenManager - The TokenManager instance to capture state for
   */
  public addUndo(tokenManager: TokenManager): void {
    // Clear redo stack when new operation is performed
    this.redoStack = []
    
    // Create state snapshot
    const snapshot: StateSnapshot = {
      tokenManagerState: this.serializeTokens(tokenManager.tokens),
      currentIndex: this.store?.state.currentIndex || 0,
      edited: tokenManager.edited,
      timestamp: Date.now()
    }

    // If store is available, also capture tokenManagers array
    if (this.store?.state.tokenManagers) {
      snapshot.tokenManagers = this.store.state.tokenManagers.map(tm => ({
        tokens: this.serializeTokens(tm.tokens),
        edited: tm.edited
      }))
    }

    this.undoStack.push(snapshot)
    this.trimStack()
  }

  /**
   * Undo the last operation.
   * @param tokenManager - The TokenManager instance to restore state to
   */
  public undo(tokenManager: TokenManager): void {
    const snapshot = this.undoStack.pop()
    if (!snapshot) return

    // Save current state to redo stack before restoring
    const currentSnapshot: StateSnapshot = {
      tokenManagerState: this.serializeTokens(tokenManager.tokens),
      currentIndex: this.store?.state.currentIndex || 0,
      edited: tokenManager.edited,
      timestamp: Date.now()
    }

    if (this.store?.state.tokenManagers) {
      currentSnapshot.tokenManagers = this.store.state.tokenManagers.map(tm => ({
        tokens: this.serializeTokens(tm.tokens),
        edited: tm.edited
      }))
    }

    this.redoStack.push(currentSnapshot)

    // Restore the snapshot
    this.restoreSnapshot(snapshot, tokenManager)
  }

  /**
   * Redo the next operation.
   * @param tokenManager - The TokenManager instance to restore state to
   */
  public redo(tokenManager: TokenManager): void {
    const snapshot = this.redoStack.pop()
    if (!snapshot) return

    // Save current state to undo stack before restoring
    const currentSnapshot: StateSnapshot = {
      tokenManagerState: this.serializeTokens(tokenManager.tokens),
      currentIndex: this.store?.state.currentIndex || 0,
      edited: tokenManager.edited,
      timestamp: Date.now()
    }

    if (this.store?.state.tokenManagers) {
      currentSnapshot.tokenManagers = this.store.state.tokenManagers.map(tm => ({
        tokens: this.serializeTokens(tm.tokens),
        edited: tm.edited
      }))
    }

    this.undoStack.push(currentSnapshot)

    // Restore the snapshot
    this.restoreSnapshot(snapshot, tokenManager)
  }

  /**
   * Undo all operations back to the initial state.
   * @param tokenManager - The TokenManager instance to restore state to
   */
  public undoAll(tokenManager: TokenManager): void {
    if (this.undoStack.length === 0) return

    // Save current state to redo stack
    const currentSnapshot: StateSnapshot = {
      tokenManagerState: this.serializeTokens(tokenManager.tokens),
      currentIndex: this.store?.state.currentIndex || 0,
      edited: tokenManager.edited,
      timestamp: Date.now()
    }

    if (this.store?.state.tokenManagers) {
      currentSnapshot.tokenManagers = this.store.state.tokenManagers.map(tm => ({
        tokens: this.serializeTokens(tm.tokens),
        edited: tm.edited
      }))
    }

    // Move all undo states to redo stack (in reverse order to maintain chronology)
    const allStates = [...this.undoStack]
    this.redoStack = [currentSnapshot, ...allStates.reverse()]

    // Get the oldest state (first in undo stack)
    const oldestState = this.undoStack[0]
    this.undoStack = []

    // Restore to oldest state
    this.restoreSnapshot(oldestState, tokenManager)
  }

  /**
   * Serialize tokens array for storage in snapshot.
   * @param tokens - The tokens array to serialize
   * @returns Serialized tokens that can be stored and later restored
   */
  private serializeTokens(tokens: TMTokens[]): TMTokens[] {
    return tokens.map(token => {
      if ('type' in token && token.type === 'token-block') {
        const block = token as TMTokenBlock
        return {
          type: 'token-block',
          start: block.start,
          end: block.end,
          currentState: block.currentState,
          tokens: [...block.tokens],
          labelClass: { ...block.labelClass },
          reviewed: block.reviewed,
          history: [...block.history]
        } as TMTokens
      } else if ('type' in token && token.type === 'token') {
        const tmToken = token as TMToken
        return {
          type: 'token',
          start: tmToken.start,
          end: tmToken.end,
          currentState: tmToken.currentState,
          text: tmToken.text
        } as TMTokens
      }
      return { ...token }
    })
  }

  /**
   * Restore a state snapshot to the TokenManager.
   * @param snapshot - The state snapshot to restore
   * @param tokenManager - The TokenManager instance to restore to
   */
  private restoreSnapshot(snapshot: StateSnapshot, tokenManager: TokenManager): void {
    // Restore tokens
    tokenManager.tokens = this.deserializeTokens(snapshot.tokenManagerState)
    tokenManager.edited = snapshot.edited

    // Update store state if store reference is available
    if (this.store) {
      // Update current index if it has changed
      if (this.store.state.currentIndex !== snapshot.currentIndex) {
        this.store.commit('setCurrentIndex', snapshot.currentIndex)
      }

      // Restore tokenManagers array if it was captured
      if (snapshot.tokenManagers && this.store.state.tokenManagers) {
        snapshot.tokenManagers.forEach((serialized, index) => {
          const originalTM = this.store!.state.tokenManagers![index]
          if (originalTM) {
            originalTM.tokens = this.deserializeTokens(serialized.tokens)
            originalTM.edited = serialized.edited
          }
        })
        // Note: We don't commit this directly as it might interfere with reactivity
        // The tokenManager parameter should be the active one from the store
      }
    }
  }

  /**
   * Deserialize tokens array from snapshot storage.
   * @param serializedTokens - The serialized tokens to restore
   * @returns Properly reconstructed TMTokens array
   */
  private deserializeTokens(serializedTokens: TMTokens[]): TMTokens[] {
    return serializedTokens.map(token => {
      if ('type' in token && token.type === 'token-block') {
        const serialized = token as TMTokenBlock & { 
          tokens: TMToken[]
          labelClass: { name: string; color: string; id: string }
          history: { action: string; timestamp: number }[] 
        }
        return new TMTokenBlock(
          serialized.start,
          serialized.end,
          serialized.tokens,
          serialized.labelClass,
          serialized.currentState,
          serialized.reviewed,
          serialized.history
        )
      } else if ('type' in token && token.type === 'token') {
        const serialized = token as TMToken & { text: string }
        return new TMToken(
          serialized.start,
          serialized.end,
          serialized.text,
          serialized.currentState
        )
      }
      return token
    })
  }

  /**
   * Trim the undo stack to the maximum allowed size.
   */
  private trimStack(): void {
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack = this.undoStack.slice(-this.maxStackSize)
    }
    if (this.redoStack.length > this.maxStackSize) {
      this.redoStack = this.redoStack.slice(-this.maxStackSize)
    }
  }

  // Legacy methods for backward compatibility
  /**
   * @deprecated Use addUndo(tokenManager) instead
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public addCreateUndo(_start: number): void {
    // This method is deprecated but maintained for backward compatibility
    console.warn('addCreateUndo is deprecated. Use addUndo(tokenManager) instead.')
  }

  /**
   * @deprecated Use addUndo(tokenManager) instead
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public addDeleteUndo(_block: TMTokenBlock): void {
    // This method is deprecated but maintained for backward compatibility
    console.warn('addDeleteUndo is deprecated. Use addUndo(tokenManager) instead.')
  }

  /**
   * @deprecated Use addUndo(tokenManager) instead
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public addUpdateUndo(_block: TMTokenBlock): void {
    // This method is deprecated but maintained for backward compatibility
    console.warn('addUpdateUndo is deprecated. Use addUndo(tokenManager) instead.')
  }

  /**
   * @deprecated Use addUndo(tokenManager) instead
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public addOverlappingUndo(_overlappingBlocks: TMTokenBlock[], _newBlockStart: number): void {
    // This method is deprecated but maintained for backward compatibility
    console.warn('addOverlappingUndo is deprecated. Use addUndo(tokenManager) instead.')
  }
}
