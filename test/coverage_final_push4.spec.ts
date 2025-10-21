import { mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import { LabelManager } from '../src/components/managers/LabelManager'
import TokenManager from '../src/components/managers/TokenManager'
import Tokenizer from '../src/components/managers/Tokenizer'
import { AnnotationManager, Entity, History, Paragraph } from '../src/components/managers/AnnotationManager'
import AnnotationPage from '../src/components/pages/AnnotationPage.vue'
import ReviewPage from '../src/components/pages/ReviewPage.vue'

// 1) AnnotationManager: exercise all generateHistoryEntryForExport branches explicitly
test('AnnotationManager generateHistoryEntryForExport branches', () => {
  const lm = new LabelManager()
  lm.addLabel('L')
  lm.addLabel('OLD')
  const labelL = lm.getLabelByName('L')!
  const labelOld = lm.getLabelByName('OLD')!

  // Case A: reviewed=true, latestEntry annotator != newAnnotator, latestEntry.state == currentState and label equal -> duplicate copy pushed
  const hA = new History('Reviewed', 'L', 'oldUser', History.formatDate(new Date()))
  const eA = new Entity(0, 1, [hA], labelL, true, 'Reviewed')
  const pA = new Paragraph('p')
  pA.entities.push(eA)
  // toRDF will call generateHistoryEntryForExport('RDF Export')
  eA.toRDF(pA, lm)
  expect(eA.history.length).toBeGreaterThanOrEqual(2)
  expect(eA.history[eA.history.length - 1].annotatorName).toBe('RDF Export')

  // Case B: currentState is Candidate and history empty -> push newHistoryEntry
  const eB = new Entity(0, 1, [], undefined, false, 'Candidate')
  eB.toJSON('annotatorB')
  expect(eB.history.length).toBe(1)
  expect(eB.history[0].annotatorName).toBe('annotatorB')

  // Case C: latestEntry state/label differs -> push newHistoryEntry
  const hC = new History('Candidate', 'OLD', 'u1', History.formatDate(new Date()))
  const eC = new Entity(0, 2, [hC], labelL, false, 'Reviewed')
  eC.toJSON('newUser')
  expect(eC.history.length).toBeGreaterThanOrEqual(2)
  expect(eC.history[eC.history.length - 1].annotatorName).toBe('newUser')
})

// 2) TokenManager: targetedBlocks and reinsertion branches
test('TokenManager targetedBlocks and overlapped reinsertion branches', () => {
  const lm = new LabelManager()
  lm.addLabel('T')
  const spans = Tokenizer.span_tokenize('one two three four')
  const tm = new TokenManager(lm, spans)

  // add a block from structure (imported) so blocksInRange returns it
  const importedEntity = new Entity(1, 2, [], lm.getLabelByName('T'), false, 'Candidate')
  tm.addBlockFromStructure(importedEntity)
  // targetedBlocks should include the imported block when we add a new block overlapping the same range
  tm.addNewBlock(1, 2, lm.getLabelByName('T'), 'Suggested', [], true)
  const b = tm.getBlockByStart(1)
  expect(b).toBeTruthy()
  // the block's end should align with the targeted block end (should not throw)
  expect(b!.end).toBeGreaterThanOrEqual(2)

  // Now test overlapped reinsertion path: create a block then add an overlapping selection with manualState=false
  const tm2 = new TokenManager(lm, spans)
  tm2.addNewBlock(0, 1, lm.getLabelByName('T'), 'Candidate', [], true)
  // now overlapping add without manualState should mark overlapped and then reinsert
  tm2.addNewBlock(0, 2, lm.getLabelByName('T'), 'Suggested', [], false)
  // ensure at least one TMTokenBlock exists in tokens after reinsertion
  const anyBlocks = tm2.tokens.filter(t => (t as any).type === 'token-block')
  expect(anyBlocks.length).toBeGreaterThanOrEqual(1)
})

// 3) AnnotationPage & ReviewPage created() branches (inputSentences triggers tokenizeCurrentSentence and emitter wiring)
test('AnnotationPage and ReviewPage created hook triggers tokenizeCurrentSentence and emitter registration', () => {
  const am = AnnotationManager.fromText('sentence one') // non-empty inputSentences
  const lm = new LabelManager()
  lm.addLabel('X')
  const spans = Tokenizer.span_tokenize('a b')
  const tm = new TokenManager(lm, spans)

  const emitter = { on: vi.fn(), off: vi.fn() }
  const store = { state: { annotationManager: am, currentPage: 'annotate', currentIndex: 0, tokenManager: tm, tokenManagers: [tm], labelManager: lm, versionControlManager: { addUndo: vi.fn() } }, commit: vi.fn() }

  const wrapperA = mount(AnnotationPage, { global: { mocks: { $store: store, emitter }, stubs: { 'info-bar': true } } })
  // created() should have registered emitter and called setTokenManager via commit through tokenizeCurrentSentence
  expect((emitter.on as any).mock.calls.length).toBeGreaterThanOrEqual(1)
  expect(store.commit).toHaveBeenCalled()
  wrapperA.unmount()

  const wrapperR = mount(ReviewPage, { global: { mocks: { $store: store, emitter }, stubs: { 'info-bar': true } } })
  expect((emitter.on as any).mock.calls.length).toBeGreaterThanOrEqual(1)
  wrapperR.unmount()
})

// 4) shared.vue: No Tags Available dialog branch (selection present but no labels)
test('shared.vue selectTokens No Tags Available dialog branch', () => {
  const amEmpty = new AnnotationManager([])
  const lmEmpty = new LabelManager()
  // ensure no labels
  const tm = new TokenManager(lmEmpty, Tokenizer.span_tokenize('x y'))
  const store = { state: { annotationManager: amEmpty, currentPage: 'annotate', currentIndex: 0, tokenManager: tm, tokenManagers: [tm], labelManager: lmEmpty, versionControlManager: { addUndo: vi.fn() } }, commit: vi.fn() }

  // stub selection that parses successfully
  const sel = {
    anchorNode: {},
    focusNode: {},
    anchorOffset: 0,
    focusOffset: 1,
    rangeCount: 1,
    getRangeAt: (i: number) => ({ startContainer: { parentElement: { id: 't0' } }, endContainer: { parentElement: { id: 't0' }, endOffset: 0 } }),
    empty: vi.fn()
  }
  // use a typed document accessor to avoid 'any' lint errors
  const docAccessor = document as unknown as { getSelection?: () => unknown }
  const origDocSel = docAccessor.getSelection
  ;(docAccessor as { getSelection?: () => unknown }).getSelection = () => sel

  const dialogSpy = vi.fn(() => ({ onOk: vi.fn(), onCancel: vi.fn() }))
  const wrapper = mount(AnnotationPage, { global: { mocks: { $store: store, $q: { dialog: dialogSpy, dark: { isActive: false } } }, stubs: { 'info-bar': true } } })
  ;(wrapper.vm as unknown as { selectTokens: (arg: unknown) => void }).selectTokens({})
  // ensure dialog was invoked (safe check for mock.calls)
  interface MockWithCalls { mock?: { calls?: unknown[] } }
  const called = typeof dialogSpy === 'function' && ((dialogSpy as MockWithCalls).mock?.calls?.length ?? 0) > 0
  if (!called) throw new Error('expected $q.dialog to be called')

  ;(docAccessor as { getSelection?: () => unknown }).getSelection = origDocSel
  wrapper.unmount()
})
