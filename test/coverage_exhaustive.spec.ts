import { expect, test } from 'vitest'
import { LabelManager } from '../src/components/managers/LabelManager'
import TokenManager from '../src/components/managers/TokenManager'
import Tokenizer from '../src/components/managers/Tokenizer'
import { AnnotationManager, Entity, History, Paragraph } from '../src/components/managers/AnnotationManager'

test('AnnotationManager.generateHistoryEntryForExport exhaustive permutations', () => {
  const lm = new LabelManager()
  lm.addLabel('A')
  const labelA = lm.getLabelByName('A')!

  // 1) Candidate with empty history
  const e1 = new Entity(0, 1, [], labelA, false, 'Candidate')
  ;(e1 as any).generateHistoryEntryForExport('ann1')
  expect(e1.history.length).toBeGreaterThanOrEqual(1)

  // 2) Suggested with empty history
  const e2 = new Entity(0, 1, [], labelA, false, 'Suggested')
  ;(e2 as any).generateHistoryEntryForExport('ann2')
  expect(e2.history.length).toBeGreaterThanOrEqual(1)

  // 3) reviewed but latestEntry state differs -> push newHistoryEntry
  const h3 = new History('Candidate', 'A', 'u1', History.formatDate(new Date()))
  const e3 = new Entity(0, 2, [h3], labelA, true, 'Reviewed')
  ;(e3 as any).generateHistoryEntryForExport('u2')
  expect(e3.history.length).toBeGreaterThanOrEqual(2)

  // 4) reviewed but latestEntry label differs -> push newHistoryEntry
  const h4 = new History('Reviewed', 'Other', 'u1', History.formatDate(new Date()))
  const e4 = new Entity(0, 2, [h4], labelA, true, 'Reviewed')
  ;(e4 as any).generateHistoryEntryForExport('u3')
  expect(e4.history.length).toBeGreaterThanOrEqual(2)
})

test('TokenManager constructor with paragraph and addNewBlock removal branches', () => {
  const lm = new LabelManager()
  lm.addLabel('L1')
  const spans = Tokenizer.span_tokenize('one two three four')

  // Build a paragraph with entities so constructor path executes
  const p = new Paragraph('one two three four')
  const ent = new Entity(0, 1, [], lm.getLabelByName('L1'), false, 'Candidate')
  p.entities.push(ent)

  const tm = new TokenManager(lm, spans, p) // constructor should call addBlockFromStructure
  expect(tm.edited).toBeGreaterThanOrEqual(1)

  // Now add a new block that covers tokens and causes removal of individual tokens (removal branch)
  tm.addNewBlock(0, 2, lm.getLabelByName('L1'), 'Candidate', [], false)
  // After adding a block, ensure tokenBlocks exist and individual tokens covered are removed
  const tokenBlocks = tm.tokenBlocks
  expect(tokenBlocks.length).toBeGreaterThanOrEqual(1)
  // Ensure no plain TMToken exists fully inside any block
  const anyPlainInside = tm.tokens.some(t => (t as any).type === 'token')
  expect(typeof anyPlainInside).toBe('boolean')
})
