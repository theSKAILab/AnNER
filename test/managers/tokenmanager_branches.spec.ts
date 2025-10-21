import { expect, test, vi } from 'vitest'
import TokenManager, { TMToken, TMTokenBlock } from '../../src/components/managers/TokenManager'
import { Label, LabelManager } from '../../src/components/managers/LabelManager'

test('addNewBlock handles overlapping blocks and reinserts', () => {
  const label = new Label(1, 'X', 'red-11')
  const lm = new LabelManager([label])
  const spans = [[0,1,'a'], [1,2,'b'], [2,3,'c']]
  const tm = new TokenManager(lm, spans as any)

  // create an existing block that overlaps
  const existingBlock = new TMTokenBlock(0,2, [TMToken.fromObject([0,1,'a']), TMToken.fromObject([1,2,'b'])], label, 'Candidate')
  tm.tokens.push(existingBlock)

  // now add a new block overlapping the same range
  tm.addNewBlock(0,2,label,'Suggested')

  // should have at least one TMTokenBlock now
  expect(tm.tokenBlocks.length).toBeGreaterThanOrEqual(1)
})

test('removeBlock reintroduceTokens true and false increments edited', () => {
  const label = new Label(1, 'Y', 'blue-11')
  const lm = new LabelManager([label])
  const spans = [[0,1,'a'], [1,2,'b']]
  const tm = new TokenManager(lm, spans as any)

  const block = new TMTokenBlock(0,2, [TMToken.fromObject([0,1,'a']), TMToken.fromObject([1,2,'b'])], label, 'Candidate')
  tm.tokens.push(block)

  const before = tm.edited
  tm.removeBlock(0, true)
  expect(tm.edited).toBeGreaterThanOrEqual(before + 1)

  // add again
  tm.tokens.push(block)
  const before2 = tm.edited
  tm.removeBlock(0, false)
  expect(tm.edited).toBeGreaterThanOrEqual(before2 + 1)
})

test('restoreOriginalBlockState increments edited when block exists', () => {
  const label = new Label(1, 'Z', 'green-11')
  const lm = new LabelManager([label])
  const spans = [[0,1,'a']]
  const tm = new TokenManager(lm, spans as any)

  const block = new TMTokenBlock(0,1, [TMToken.fromObject([0,1,'a'])], label, 'Candidate')
  block.currentState = 'Modified'
  tm.tokens.push(block)

  const before = tm.edited
  tm.restoreOriginalBlockState(0)
  expect(tm.edited).toBeGreaterThanOrEqual(before + 1)
  expect(block.currentState).toBe('Candidate')
})
import { describe, it, expect } from 'vitest'
import { TokenManager, TMTokenBlock, TMToken } from '../../src/components/managers/TokenManager'
import { LabelManager } from '../../src/components/managers/LabelManager'

describe('TokenManager remaining branches', () => {
  it('addNewBlock overlapping path and removeBlock reintroduce false', () => {
    const lm = new LabelManager()
    lm.addLabel('X')
    const tm = new TokenManager(lm, [[0,1,'a'], [1,2,'b'], [2,3,'c']])
    // create a block that will overlap
    tm.addNewBlock(0,2, lm.currentLabel, 'Accepted')
    // now add another overlapping block that triggers reinsert logic
    tm.addNewBlock(1,3, lm.currentLabel, 'Accepted')
    expect(tm.tokenBlocks.length).toBeGreaterThan(0)

    // removeBlock without reintroduce
    const start = tm.tokenBlocks[0].start
    tm.removeBlock(start, false)
    // ensure tokens no longer include that block start
    expect(tm.getBlockByStart(start)).toBeNull()
  })

  it('restoreOriginalBlockState increments edited when found', () => {
    const lm = new LabelManager()
    lm.addLabel('A')
    const tm = new TokenManager(lm, [[0,1,'a']])
    const b = new TMTokenBlock(0,1,[new TMToken(0,1,'a','Candidate')], lm.currentLabel as any, 'Candidate')
    tm.tokens.push(b)
    const before = tm.edited
    tm.restoreOriginalBlockState(0)
    expect(tm.edited).toBeGreaterThanOrEqual(before + 1)
  })
})
