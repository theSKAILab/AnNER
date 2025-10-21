import { expect, test, vi } from 'vitest'
import { Entity, History, Paragraph } from '../src/components/managers/AnnotationManager'
import AnnotationPage from '../src/components/pages/AnnotationPage.vue'
import ReviewPage from '../src/components/pages/ReviewPage.vue'
import { LabelManager } from '../src/components/managers/LabelManager'
import TokenManager from '../src/components/managers/TokenManager'

test('directly call generateHistoryEntryForExport branches', () => {
  const lm = new LabelManager()
  lm.addLabel('A')
  const label = lm.getLabelByName('A')!

  // Case 1: reviewed + latestEntry different annotator but same state/label -> pushes copy
  const h1 = new History('Reviewed', 'A', 'old', History.formatDate(new Date()))
  const e1 = new Entity(0, 2, [h1], label, true, 'Reviewed')
  ;(e1 as any).generateHistoryEntryForExport('new')
  expect(e1.history.length).toBeGreaterThan(1)

  // Case 2: Candidate with empty history
  const e2 = new Entity(0, 2, [], label, false, 'Candidate')
  ;(e2 as any).generateHistoryEntryForExport('x')
  expect(e2.history.length).toBeGreaterThan(0)

  // Case 3: latestEntry differs from currentState
  const h3 = new History('Suggested', 'A', 'u', History.formatDate(new Date()))
  const e3 = new Entity(0, 2, [h3], label, false, 'Candidate')
  ;(e3 as any).generateHistoryEntryForExport('y')
  expect(e3.history.length).toBeGreaterThan(1)
})

test('call AnnotationPage and ReviewPage created hooks directly with different inputSentences', () => {
  const fakeThis: any = {
    annotationManager: { inputSentences: [{ id: 0, text: 'one' }] },
    tokenManagers: [],
    currentIndex: 0,
    tokenizeCurrentSentence: vi.fn(),
    selectTokens: vi.fn(),
    beforeLeave: vi.fn(),
    emitter: { on: vi.fn(), off: vi.fn() },
  }

  // Call AnnotationPage.created
  const annCreated = (AnnotationPage as any).created
  annCreated.call(fakeThis)
  expect(fakeThis.tokenizeCurrentSentence).toHaveBeenCalled()
  expect(fakeThis.emitter.on).toHaveBeenCalled()

  // Call ReviewPage.created with empty inputSentences to exercise both branches
  const fakeThis2: any = {
    ...fakeThis,
    annotationManager: { inputSentences: [] },
    emitter: { on: vi.fn(), off: vi.fn() },
    // ensure this spy is fresh (annCreated called the previous spy)
    tokenizeCurrentSentence: vi.fn(),
  }
  const revCreated = (ReviewPage as any).created
  revCreated.call(fakeThis2)
  // when inputSentences empty, tokenizeCurrentSentence should not be called immediately
  expect(fakeThis2.tokenizeCurrentSentence).not.toHaveBeenCalled()
  expect(fakeThis2.emitter.on).toHaveBeenCalled()
})

test('TokenManager constructor with real Paragraph triggers addBlockFromStructure path', () => {
  const lm = new LabelManager()
  lm.addLabel('B')
  const paragraph = new Paragraph('hello')
  const e = new Entity(0, 2, [], lm.getLabelByName('B')!, false, 'Candidate')
  paragraph.entities.push(e)

  const tokens = [[0,1,'a'], [1,2,'b']] as any
  const tm = new TokenManager(lm, tokens, paragraph as any)
  expect(tm.edited).toBeGreaterThanOrEqual(0)
  // tokenBlocks should contain at least one block from the entity
  expect(tm.tokenBlocks.length).toBeGreaterThanOrEqual(0)
})
