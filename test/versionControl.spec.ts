import { describe, it, expect, beforeEach } from 'vitest'
import { VersionControlManager } from '../src/components/managers/VersionControlManager'
import { LabelManager } from '../src/components/managers/LabelManager'
import { TokenManager, TMToken, TMTokenBlock } from '../src/components/managers/TokenManager'

describe('VersionControlManager', () => {
  let vcm: VersionControlManager
  beforeEach(() => {
    vcm = new VersionControlManager()
  })

  it('can push and undo/redo simple token changes', () => {
    const lm = new LabelManager()
    const tm = new TokenManager(lm, [])
    const token = new TMToken(0, 1, 'a', 'Candidate')
    tm.tokens.push(token)
    vcm.addUndo(tm)
    token.currentState = 'Accepted'
    vcm.undo(tm)
    expect((tm.tokens[0] as TMToken).currentState).toBe('Candidate')
    vcm.redo(tm)
    expect((tm.tokens[0] as TMToken).currentState).toBe('Accepted')
  })

  it('undo/redo stacks behave and counts update', () => {
    const lm = new LabelManager()
    const tm = new TokenManager(lm, [])
    const t1 = new TMToken(0,1,'x','Candidate')
    tm.tokens.push(t1)
    expect(vcm.getUndoCount()).toBe(0)
    vcm.addUndo(tm)
    expect(vcm.getUndoCount()).toBe(1)
    vcm.undo(tm)
    expect(vcm.getRedoCount()).toBe(1)
  })
})
