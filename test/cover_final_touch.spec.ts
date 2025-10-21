import { mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import Tokenizer from '../src/components/managers/Tokenizer'
import { LabelManager } from '../src/components/managers/LabelManager'
import TokenManager, { TMTokenBlock, TMToken } from '../src/components/managers/TokenManager'
import { Entity } from '../src/components/managers/AnnotationManager'
import AnnotationPage from '../src/components/pages/AnnotationPage.vue'
import ReviewPage from '../src/components/pages/ReviewPage.vue'

test('TokenManager constructor uses currentParagraph.entities and addBlockFromStructure', () => {
  const lm = new LabelManager()
  lm.addLabel('T')
  const tokens = Tokenizer.span_tokenize('alpha beta')
  const tm = new TokenManager(lm, tokens)

  // create an entity that should be reconstituted into a block by constructor when passed as currentParagraph
  const ent = new Entity(0, 5, [], lm.getLabelByName('T')!, false, 'Candidate')
  // construct TokenManager with a fake paragraph object that contains the entity instance
  const tm2 = new TokenManager(lm, tokens, { entities: [ent] } as any)

  // addBlockFromStructure increments edited, so constructor path should have caused edited > 0
  expect(tm2.edited).toBeGreaterThan(0)
  // There should be at least one TMTokenBlock created from the entity
  expect(tm2.tokenBlocks.length).toBeGreaterThan(0)
})

test('addNewBlock reinserts overlapped TMTokenBlock and marks them Rejected when not manual', () => {
  const lm = new LabelManager()
  lm.addLabel('X')
  const tokens = Tokenizer.span_tokenize('one two three four')
  const tm = new TokenManager(lm, tokens)

  // create a real TMTokenBlock that will overlap the new selection
  const blockTokens = tm.tokens.slice(1, 3) as TMToken[]
  const block = new TMTokenBlock(blockTokens[0].start, blockTokens[blockTokens.length - 1].end, blockTokens, lm.getLabelByName('X')!, 'Candidate')
  tm.tokens.push(block)
  tm.tokens.sort((a, b) => a.start - b.start)

  // selection that overlaps the block
  const selStart = block.start
  const selEnd = block.end

  tm.addNewBlock(selStart, selEnd, lm.getLabelByName('X'), 'Suggested', [], false)

  // After operation, the original block instance should still be present in tokens and set to Rejected
  expect(tm.tokens.includes(block)).toBe(true)
  expect(block.currentState).toBe('Rejected')
})

test('AnnotationPage and ReviewPage created/unmount register and unregister emitter handlers', () => {
  const lm = new LabelManager()
  lm.addLabel('L')
  const tokens = Tokenizer.span_tokenize('one two')
  const tm = new TokenManager(lm, tokens)

  const am = { inputSentences: [{ id: 0, text: 'one two' }] }
  const emitter = { on: vi.fn(), off: vi.fn() }

  const store = { state: { annotationManager: am, currentPage: 'annotate', currentIndex: 0, tokenManager: tm, tokenManagers: [tm], labelManager: lm, versionControlManager: { addUndo: vi.fn() } }, commit: vi.fn() }

  const a = mount(AnnotationPage, { global: { mocks: { $store: store, emitter }, stubs: { 'info-bar': true } } })
  a.unmount()
  expect(emitter.on).toHaveBeenCalled()
  expect(emitter.off).toHaveBeenCalled()

  const r = mount(ReviewPage, { global: { mocks: { $store: store, emitter }, stubs: { 'info-bar': true } } })
  r.unmount()
  expect(emitter.on).toHaveBeenCalled()
  expect(emitter.off).toHaveBeenCalled()
})
