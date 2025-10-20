/* eslint-disable @typescript-eslint/no-explicit-any */
import { TokenManager, TMTokenBlock, TMToken } from '../src/components/managers/TokenManager'
import { LabelManager } from '../src/components/managers/LabelManager'
import { describe, it, expect } from 'vitest'

describe('TokenManager edge cases', () => {
  it('addBlockFromStructure inserts block and increments edited', () => {
    const lm = new LabelManager()
    lm.addLabel('A')
    const tokens = [[0,1,'a'], [1,2,'b']] as any
    const tm = new TokenManager(lm, tokens)

    const block = new TMTokenBlock(0, 2, [new TMToken(0,1,'a','Candidate'), new TMToken(1,2,'b','Candidate')], lm.getLabelByName('A') as any, 'Candidate')
    const before = tm.edited
    tm.addBlockFromStructure(block)
    expect(tm.getBlockByStart(0)).not.toBeNull()
    expect(tm.edited).toBe(before + 1)
  })

  it('removeBlock with reintroduceTokens=false does not reinsert tokens', () => {
    const lm = new LabelManager()
    lm.addLabel('B')
    const tokens = [[0,1,'x'], [1,2,'y']] as any
    const tm = new TokenManager(lm, tokens)

    // add block normally
    tm.addNewBlock(0,2, lm.getLabelByName('B'), 'Candidate', [])
    const beforeTokens = tm.tokens.length
    tm.removeBlock(0, false)
    // after removal without reintroduceTokens, tokens should be smaller or equal
    expect(tm.tokens.length).toBeLessThanOrEqual(beforeTokens)
    // block should no longer exist
    expect(tm.getBlockByStart(0)).toBeNull()
  })

  it('removeDuplicateBlocks deduplicates token blocks', () => {
    const lm = new LabelManager()
    lm.addLabel('C')
    const tokens = [[0,1,'a'], [1,2,'b']] as any
    const tm = new TokenManager(lm, tokens)
    tm.addNewBlock(0,2, lm.getLabelByName('C'), 'Candidate', [])
    // artificially duplicate
    const blk = tm.getBlockByStart(0)
    if (blk) tm.tokens.push(blk)
    const before = tm.tokens.length
    tm.removeDuplicateBlocks()
    expect(tm.tokens.length).toBeLessThan(before)
  })

  it('restoreOriginalBlockState is safe when block exists', () => {
    const lm = new LabelManager()
    lm.addLabel('D')
    const tokens = [[0,1,'a'], [1,2,'b']] as any
    const tm = new TokenManager(lm, tokens)
    tm.addNewBlock(0,2, lm.getLabelByName('D'), 'Candidate', [])
    const blk = tm.getBlockByStart(0)
    expect(() => { if (blk) { blk.currentState = 'Modified'; tm.restoreOriginalBlockState(0) } }).not.toThrow()
  })
})
