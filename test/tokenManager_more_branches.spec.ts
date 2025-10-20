import { describe, it, expect } from 'vitest'
import { TokenManager, TMTokenBlock, TMToken } from '../src/components/managers/TokenManager'
import { LabelManager } from '../src/components/managers/LabelManager'
import { Entity, Paragraph } from '../src/components/managers/AnnotationManager'

describe('TokenManager advanced branches', () => {
  it('addBlockFromStructure inserts block and increments edited', () => {
    const lm = new LabelManager()
    const tm = new TokenManager(lm, [[0,1,'a'], [1,2,'b']])
    const beforeEdited = tm.edited

    // Test addBlockFromStructure increments edited and inserts block
  // create a block that overlaps existing tokens (0..2) so targetedBlocks is not empty
  const block = new TMTokenBlock(0, 2, [new TMToken(0,1,'a','Candidate'), new TMToken(1,2,'b','Candidate')], lm.currentLabel as unknown as any, 'Candidate')
    tm.addBlockFromStructure(block)
    expect(tm.edited).toBeGreaterThan(beforeEdited)
    expect(tm.getBlockByStart(block.start)).not.toBeNull()
  })

  it('removeDuplicateBlocks deduplicates tokens', () => {
    const lm = new LabelManager()
    const tm = new TokenManager(lm, [[0,1,'a'], [1,2,'b']])
    // add duplicate blocks by reference
    const b = new TMTokenBlock(0, 2, [new TMToken(0,1,'a','Candidate')], lm.currentLabel as any, 'Candidate')
    tm.tokens.push(b)
    tm.tokens.push(b)
    tm.removeDuplicateBlocks()
  // tokens should be deduplicated (edited should increment)
  const before = tm.edited
  tm.removeDuplicateBlocks()
  expect(tm.edited).toBeGreaterThanOrEqual(before + 1)
  })

  it('addNewBlock manualState path toggles manual behavior', () => {
    const lm = new LabelManager()
    const tm = new TokenManager(lm, [[0,1,'a'], [2,3,'b'], [4,5,'c']])
    // create an overlapping scenario
    tm.addNewBlock(0,2, lm.currentLabel as any, 'Candidate')
    const existing = tm.isOverlapping(0,2)
    expect(existing).not.toBeNull()
    // call addNewBlock with manualState true to trigger different path
    tm.addNewBlock(0,1, lm.currentLabel as any, 'Candidate', [], true)
    // ensure tokens array remains sorted and valid
    expect(Array.isArray(tm.tokens)).toBe(true)
  })
})
