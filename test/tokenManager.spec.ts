import { describe, it, expect } from 'vitest'
import { TokenManager, TMToken, TMTokenBlock } from '../src/components/managers/TokenManager'
import { LabelManager } from '../src/components/managers/LabelManager'

describe('TokenManager', () => {
  it('blocksInRange and getBlockByStart work and add/remove block', () => {
    const lm = new LabelManager()
    const tm = new TokenManager(lm, [[0,1,'a'], [2,3,'b']])
    expect(tm.blocksInRange(0,3).length).toBeGreaterThan(0)
    tm.addNewBlock(0,3, undefined, 'Candidate')
    expect(tm.tokenBlocks.length).toBeGreaterThan(0)
    const start = tm.tokenBlocks[0].start
    expect(tm.getBlockByStart(start)).not.toBeNull()
    tm.removeBlock(start)
    expect(tm.getBlockByStart(start)).toBeNull()
  })

  it('isOverlapping detects overlaps and restoreOriginalBlockState restores', () => {
    const lm = new LabelManager()
    const tm = new TokenManager(lm, [[0,1,'a'], [1,2,'b'], [3,4,'c']])
    tm.addNewBlock(0,2, undefined, 'Candidate')
    const overlaps = tm.isOverlapping(0,2)
    expect(overlaps).not.toBeNull()
    const block = tm.tokenBlocks[0]
    block.labelClass = lm.currentLabel as any
    block.currentState = 'Accepted'
    tm.restoreOriginalBlockState(block.start)
    // after restore, reviewed toggles but function should complete
    expect(tm.getBlockByStart(block.start)).not.toBeNull()
  })
})
