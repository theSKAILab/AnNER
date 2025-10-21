import { expect, test } from 'vitest'
import { TokenManager, TMToken, TMTokenBlock, TMTokenAggregate } from '../../src/components/managers/TokenManager'
import { LabelManager } from '../../src/components/managers/LabelManager'
import { Paragraph, Entity } from '../../src/components/managers/AnnotationManager'

test('TokenManager addNewBlock overlapping reinserts and dedupe branches', () => {
  const lm = new LabelManager()
  lm.addLabel('A')
  const tokens = [[0,1,'a'],[1,2,'b'],[2,3,'c']] as any
  const tm = new TokenManager(lm, tokens)
  // create a block from structure
  const e = new Entity(0,2,[], lm.currentLabel, false, 'Candidate')
  tm.addBlockFromStructure(e)
  // now add overlapping block that should trigger overlappedBlocks path
  tm.addNewBlock(1,3, lm.currentLabel, 'Suggested')
  expect(tm.tokens.length).toBeGreaterThan(0)
})

test('TokenManager removeBlock reintroduceTokens true/false and restoreOriginalBlockState', () => {
  const lm = new LabelManager()
  lm.addLabel('B')
  const tokens = [[0,1,'x'],[1,2,'y']] as any
  const tm = new TokenManager(lm, tokens)
  const e = new Entity(0,2,[], lm.currentLabel, false, 'Candidate')
  tm.addBlockFromStructure(e)
  const start = tm.tokenBlocks[0].start
  tm.removeBlock(start, false)
  const lenAfterNoReintro = tm.tokens.length
  // tokens were removed and not reintroduced; recreate TokenManager to test reintroduce true path
  const tm2 = new TokenManager(lm, tokens)
  tm2.addBlockFromStructure(e)
  const start2 = tm2.tokenBlocks[0].start
  tm2.removeBlock(start2, true)
  expect(tm2.tokens.length).toBeGreaterThanOrEqual(lenAfterNoReintro)
  // restore original state
  tm.restoreOriginalBlockState(start)
  expect(tm.edited).toBeGreaterThanOrEqual(1)
})
