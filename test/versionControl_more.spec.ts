import { describe, it, expect } from 'vitest'
import { VersionControlManager } from '../src/components/managers/VersionControlManager'
import { LabelManager } from '../src/components/managers/LabelManager'
import { TokenManager, TMToken } from '../src/components/managers/TokenManager'

describe('VersionControlManager extended', () => {
  it('setMaxStackSize trims undo/redo stacks', () => {
    const vcm = new VersionControlManager()
    const lm = new LabelManager()
    const tm = new TokenManager(lm, [])
    // push several snapshots
    for (let i = 0; i < 10; i++) {
      tm.edited = i
      vcm.addUndo(tm)
    }
    expect(vcm.getUndoCount()).toBe(10)
    vcm.setMaxStackSize(5)
    expect(vcm.getUndoCount()).toBeLessThanOrEqual(5)
  })

  it('clearHistory clears stacks and undo/redo disabled', () => {
    const vcm = new VersionControlManager()
    const lm = new LabelManager()
    const tm = new TokenManager(lm, [])
    vcm.addUndo(tm)
    expect(vcm.canUndo).toBe(true)
    vcm.clearHistory()
    expect(vcm.canUndo).toBe(false)
    expect(vcm.canRedo).toBe(false)
  })
})
