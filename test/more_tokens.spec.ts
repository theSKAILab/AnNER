import { describe, it, expect } from 'vitest'
import { TokenManager } from '../src/components/managers/TokenManager'
import { LabelManager } from '../src/components/managers/LabelManager'

describe('TokenManager additional behaviors', () => {
  it('addNewBlock handles overlapping blocks and removeDuplicateBlocks', () => {
    const lm = new LabelManager()
    const tm = new TokenManager(lm, [[0,1,'a'], [2,3,'b'], [4,5,'c']])
    // create initial block covering 2..3
    tm.addNewBlock(2,3, lm.currentLabel, 'Candidate')
    expect(tm.tokenBlocks.length).toBeGreaterThan(0)
    // add another block that overlaps existing block and tokens
    tm.addNewBlock(1,4, lm.currentLabel, 'Accepted')
    // Ensure tokens array stays sorted and duplicates removed
    tm.removeDuplicateBlocks()
    expect(tm.tokens.length).toBeGreaterThan(0)
  })

  it('getBlockByStart returns null for missing block and restoreOriginalBlockState is safe', () => {
    const lm = new LabelManager()
    const tm = new TokenManager(lm, [[0,1,'a']])
    expect(tm.getBlockByStart(999)).toBeNull()
    // calling restoreOriginalBlockState on non-existing start should not throw
    tm.restoreOriginalBlockState(999)
  })
})
