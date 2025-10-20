/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import { VersionControlManager } from '../src/components/managers/VersionControlManager'

describe('VersionControlManager edge cases', () => {
  it('serialize/deserialize preserves unknown token shapes', () => {
    const vcm = new VersionControlManager()

    // fake tokenManager with an unknown token shape (no "type" property)
    const tm: any = { tokens: [{ start: 0, end: 1, currentState: 'X', extra: 'meta' }], edited: 0 }

    vcm.addUndo(tm)

    // mutate tokens to ensure restore happens
    tm.tokens = []

    vcm.undo(tm)

    // after undo, token should have been restored as plain object
    expect(tm.tokens.length).toBeGreaterThan(0)
    const restored = tm.tokens[0]
    expect(restored).toHaveProperty('extra', 'meta')
  })

  it('undoAll and redoAll iterate stacks correctly', () => {
    const vcm = new VersionControlManager()
    const tm: any = { tokens: [{ start: 0, end: 1, currentState: 'A' }], edited: 0 }

    // push multiple snapshots
    vcm.addUndo(tm)
    // mutate and push again
    tm.tokens[0].currentState = 'B'
    vcm.addUndo(tm)

    // ensure we have undo history
    expect(vcm.getUndoCount()).toBeGreaterThanOrEqual(2)

    // undoAll should move all to redo stack
    vcm.undoAll(tm)
    expect(vcm.getUndoCount()).toBe(0)
    expect(vcm.getRedoCount()).toBeGreaterThanOrEqual(1)

    // redoAll should restore back to most recent and empty redo
    vcm.redoAll(tm)
    expect(vcm.getRedoCount()).toBe(0)
    expect(vcm.getUndoCount()).toBeGreaterThanOrEqual(1)
  })
})
