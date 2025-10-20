/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest'
import { VersionControlManager } from '../src/components/managers/VersionControlManager'
import { LabelManager } from '../src/components/managers/LabelManager'
import { TokenManager, TMToken } from '../src/components/managers/TokenManager'

describe('VersionControlManager store restore branches', () => {
  let vcm: VersionControlManager
  beforeEach(() => {
    vcm = new VersionControlManager()
  })

  it('captures tokenManagers in snapshot and restores them on undo', () => {
    const lm = new LabelManager()
    const tm1 = new TokenManager(lm, [[0,1,'a']])
    const tm2 = new TokenManager(lm, [[1,2,'b']])

    // mutate some state
    tm1.tokens.push(new TMToken(2,3,'x','Candidate'))
    tm2.tokens.push(new TMToken(3,4,'y','Candidate'))

    // fake store with tokenManagers array
    const store: any = { state: { currentIndex: 1, tokenManagers: [tm1, tm2], tokenManager: tm1 }, commit: (name: string, payload: any) => { store.state.currentIndex = payload } }
    vcm.setStore(store)

    // Add undo which should capture tokenManagers
    vcm.addUndo(tm1)
    expect(vcm.getUndoCount()).toBeGreaterThanOrEqual(1)

    // Change active tokenManagers to empty to ensure restore does something
    tm1.tokens = []
    tm2.tokens = []

    vcm.undo(tm1)

    // After undo, the tokenManagers in store should have been restored
    expect(store.state.tokenManagers[0].tokens.length).toBeGreaterThan(0)
    expect(store.state.currentIndex).toBe(1)
  })

  it('trimStack respects maxStackSize and keeps recent snapshots', () => {
    vcm.setMaxStackSize(2)
    const lm = new LabelManager()
    const tm = new TokenManager(lm, [])
    // Push multiple snapshots
    vcm.addUndo(tm)
    vcm.addUndo(tm)
    vcm.addUndo(tm)
    // Only last two should remain
    expect(vcm.getUndoCount()).toBeLessThanOrEqual(2)
  })
})
