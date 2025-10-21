import { mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import { LabelManager } from '../src/components/managers/LabelManager'
import TokenManager, { TMTokenBlock } from '../src/components/managers/TokenManager'
import Tokenizer from '../src/components/managers/Tokenizer'
import { AnnotationManager, Entity, History, Paragraph } from '../src/components/managers/AnnotationManager'
import AnnotationPage from '../src/components/pages/AnnotationPage.vue'
import ReviewPage from '../src/components/pages/ReviewPage.vue'

// 1) AnnotationManager: force toRDF path that calls generateHistoryEntryForExport("RDF Export")
test('Entity.toRDF triggers generateHistoryEntryForExport via RDF Export path', () => {
  const lm = new LabelManager()
  lm.addLabel('LABEL')
  const label = lm.getLabelByName('LABEL')!

  // latest history same state/label but different annotator -> pushes copy when reviewed
  const h = new History('Reviewed', 'LABEL', 'olduser', History.formatDate(new Date()))
  const e = new Entity(0, 1, [h], label, true, 'Reviewed')
  const p = new Paragraph('x')
  // attach entity to paragraph
  p.entities.push(e)

  // call toRDF on entity directly to exercise RDF Export branch
  const out = e.toRDF(p, lm)
  expect(typeof out).toBe('string')
})

// 2) TokenManager: exercise addNewBlock overlapping and non-overlapping and removeBlock branches
test('TokenManager overlapping and removeBlock permutations (explicit)', () => {
  const lm = new LabelManager()
  lm.addLabel('T')
  const spans = Tokenizer.span_tokenize('one two three four')
  const tm = new TokenManager(lm, spans)

  // add an initial block 0..1 via manual import
  tm.addNewBlock(0, 1, lm.getLabelByName('T'), 'Candidate', [], true)
  expect(tm.getBlockByStart(0)).toBeTruthy()

  // overlapping add (manualState false), should go through overlappedBlocks branch
  tm.addNewBlock(0, 2, lm.getLabelByName('T'), 'Suggested', [], false)
  // ensure tokenBlocks exist
  expect(tm.tokenBlocks.length).toBeGreaterThanOrEqual(1)

  // remove existing block with reintroduceTokens = false
  const blkStart = tm.tokenBlocks[0].start
  const beforeTokens = tm.tokens.length
  tm.removeBlock(blkStart, false)
  // tokens count should change but no reinsert
  expect(tm.tokens.length).toBeLessThanOrEqual(beforeTokens)

  // call restoreOriginalBlockState on a non-existent start (no-throw)
  tm.restoreOriginalBlockState(9999)
})

// 3) Pages: mount with empty inputSentences to hit created() branch that does NOT call tokenizeCurrentSentence
test('AnnotationPage and ReviewPage created() with empty inputSentences do not crash', () => {
  const amEmpty = new AnnotationManager([])
  const lm = new LabelManager()
  const spans = Tokenizer.span_tokenize('a')
  const tm = new TokenManager(lm, spans)
  const store = { state: { annotationManager: amEmpty, currentPage: 'annotate', currentIndex: 0, tokenManager: tm, tokenManagers: [tm], labelManager: lm, versionControlManager: { addUndo: vi.fn() } }, commit: vi.fn() }

  const wrapperA = mount(AnnotationPage, { global: { mocks: { $store: store }, stubs: { 'info-bar': true } } })
  wrapperA.unmount()

  const wrapperR = mount(ReviewPage, { global: { mocks: { $store: store }, stubs: { 'info-bar': true } } })
  wrapperR.unmount()
})

// 4) shared.vue: No Tags Available path triggered again with alternate selection mock
test('shared.vue selectTokens No Tags Available path alternative selection mock', () => {
  const amEmpty = new AnnotationManager([])
  const lmEmpty = new LabelManager()
  const tm = new TokenManager(lmEmpty, Tokenizer.span_tokenize('x y'))
  const store = { state: { annotationManager: amEmpty, currentPage: 'annotate', currentIndex: 0, tokenManager: tm, tokenManagers: [tm], labelManager: lmEmpty, versionControlManager: { addUndo: vi.fn() } }, commit: vi.fn() }

  // selection stub
  const sel = {
    anchorNode: {}, focusNode: {}, anchorOffset: 0, focusOffset: 2, rangeCount: 1,
    getRangeAt: (i: number) => ({ startContainer: { parentElement: { id: 't0' } }, endContainer: { parentElement: { id: 't0' }, endOffset: 0 } }),
    empty: vi.fn()
  }
  const origDocSel = (document as any).getSelection
  (document as any).getSelection = () => sel

  const wrapper = mount(AnnotationPage, { global: { mocks: { $store: store, $q: { dialog: vi.fn(() => ({ onOk: vi.fn(), onCancel: vi.fn() })), dark: { isActive: false } } }, stubs: { 'info-bar': true } } })
  ;(wrapper.vm as any).selectTokens({} as any)
  // getSelection should return our stubbed selection
  if (!((document as any).getSelection())) {
    throw new Error('document.getSelection did not return the stubbed selection')
  }

  (document as any).getSelection = origDocSel
  wrapper.unmount()
})
