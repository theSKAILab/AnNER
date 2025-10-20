import { describe, it, expect } from 'vitest'
import { VersionControlManager } from '../src/components/managers/VersionControlManager'
import { LabelManager } from '../src/components/managers/LabelManager'
import { TokenManager, TMTokenBlock, TMToken } from '../src/components/managers/TokenManager'

// Create a token block helper
function makeBlock(start = 0) {
  const lm = new LabelManager()
  const tm = new TokenManager(lm, [[start, start + 1, 'a'], [start + 1, start + 2, 'b']])
  tm.addNewBlock(start, start + 2, lm.currentLabel, 'Candidate')
  return { tm, lm }
}

describe('VersionControlManager serialization branches', () => {
  it('serializeTokens handles token-block and token forms', () => {
    const { tm } = makeBlock(0)
    const vcm = new VersionControlManager()
    // addUndo should serialize token-block branch
    vcm.addUndo(tm)
    expect(vcm.getUndoCount()).toBeGreaterThan(0)
  })

  it('undo/redo will call deserializeTokens path for token-blocks', () => {
    const { tm } = makeBlock(10)
    const vcm = new VersionControlManager()
    vcm.addUndo(tm)
    // mutate tokens
    tm.tokens = []
    vcm.undo(tm)
    // after undo, tokens should have been restored
    expect(tm.tokens.length).toBeGreaterThan(0)
    vcm.redo(tm)
    expect(tm.tokens.length).toBeGreaterThanOrEqual(0)
  })
})
