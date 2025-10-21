import { mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import Tokenizer from '../src/components/managers/Tokenizer'
import { LabelManager } from '../src/components/managers/LabelManager'
import TokenManager, { TMTokenBlock, TMToken } from '../src/components/managers/TokenManager'
import { Entity, History, Paragraph, AnnotationManager } from '../src/components/managers/AnnotationManager'
import ReviewPage from '../src/components/pages/ReviewPage.vue'
import AnnotationPage from '../src/components/pages/AnnotationPage.vue'

// 1) AnnotationManager / Entity history permutations
test('Entity.generateHistoryEntryForExport pushes entry for Candidate with empty history', () => {
  const lm = new LabelManager()
  // no labels
  const e = new Entity(0, 1, [], undefined, false, 'Candidate')
  expect(e.history.length).toBe(0)
  e.toJSON('candidate-annotator')
  expect(e.history.length).toBe(1)
  expect(e.latestEntry()?.annotatorName).toBe('candidate-annotator')
})

test('Entity.generateHistoryEntryForExport pushes entry when state or label changed', () => {
  const lm = new LabelManager()
  lm.addLabel('TAG')
  const label = lm.getLabelByName('TAG')!
  // Last history says Candidate with label TAG, but currentState will be Reviewed -> should push
  const hist = new History('Candidate', 'TAG', 'old', History.formatDate(new Date()))
  const e = new Entity(0, 2, [hist], label, false, 'Reviewed')
  const before = e.history.length
  e.toJSON('new')
  expect(e.history.length).toBeGreaterThan(before)
  expect(e.latestEntry()?.annotatorName).toBe('new')
})

test('Entity.toRDF generates RDF and ensures history entry with RDF Export annotator', () => {
  const lm = new LabelManager()
  lm.addLabel('L')
  const label = lm.getLabelByName('L')!
  const para = new Paragraph('hello world')
  const e = new Entity(0, 5, [], label, false, 'Candidate')
  para.entities.push(e)
  const rdf = e.toRDF(para, lm)
  // generateHistoryEntryForExport("RDF Export") should have added an entry
  expect(e.history.length).toBeGreaterThanOrEqual(1)
  expect(e.latestEntry()?.annotatorName).toBe('RDF Export')
  // rdf should include onner:labeledTermText
  expect(rdf).toContain('onner:labeledTermText')
})

// 2) TokenManager addNewBlock reinsertion and targetedBlocks indexing
test('TokenManager.addNewBlock reinserts overlapped TMTokenBlock and uses targetedBlocks last end', () => {
  const lm = new LabelManager()
  lm.addLabel('T')
  const tokens = Tokenizer.span_tokenize('one two three')
  const tm = new TokenManager(lm, tokens)

  // create a block from the first two tokens and insert it
  const blockTokens = tm.tokens.slice(0, 2) as TMToken[]
  const block = new TMTokenBlock(blockTokens[0].start, blockTokens[blockTokens.length - 1].end, blockTokens, lm.getLabelByName('T')!, 'Candidate')
  tm.tokens.push(block)
  tm.tokens.sort((a, b) => a.start - b.start)

  // Now call addNewBlock overlapping that block (manualState=false) to trigger rejection and reinsertion
  tm.addNewBlock(block.start, block.end, lm.getLabelByName('T'), 'Suggested', [], false)

  // After operation, there should be at least one TMTokenBlock with the original block's start/end
  const found = tm.tokenBlocks.some(tb => tb.start === block.start && tb.end === block.end)
  expect(found).toBe(true)
})

// 3) Pages: ReviewPage created() wiring and beforeUnmount
test('ReviewPage created registers emitter and beforeUnmount removes it', () => {
  const am = new AnnotationManager([[null, 's', { entities: [] }]])
  const lm = new LabelManager()
  const tm = new TokenManager(lm, Tokenizer.span_tokenize('s'))
  const store = { state: { annotationManager: am, currentPage: 'review', currentIndex: 0, tokenManager: tm, tokenManagers: [tm], labelManager: lm }, commit: vi.fn() }
  const emitter = { on: vi.fn(), off: vi.fn() }
  const wrapper = mount(ReviewPage, { global: { mocks: { $store: store, emitter }, stubs: { 'info-bar': true } } })
  expect(emitter.on).toHaveBeenCalled()
  wrapper.unmount()
  expect(emitter.off).toHaveBeenCalled()
})

// 4) shared.vue selectTokens "No Tags Available" branch
test('selectTokens shows No Tags Available dialog and empties selection when no labels exist', () => {
  const am = new AnnotationManager([[null, 'hello', { entities: [] }]])
  const lm = new LabelManager() // no labels
  const tm = new TokenManager(lm, Tokenizer.span_tokenize('hello'))
  const store = { state: { annotationManager: am, currentPage: 'annotate', currentIndex: 0, tokenManager: tm, tokenManagers: [tm], labelManager: lm, versionControlManager: { addUndo: vi.fn() } }, commit: vi.fn() }

  // fake selection object
  const fakeRange = { startContainer: { parentElement: { id: 't0' } }, startOffset: 0, endContainer: { parentElement: { id: 't0' } }, endOffset: 1 }
  const selection = { anchorOffset: 0, focusOffset: 1, anchorNode: {}, focusNode: {}, rangeCount: 1, getRangeAt: (i: number) => fakeRange, empty: vi.fn() }
  const getSelSpy = vi.spyOn(document, 'getSelection' as any).mockImplementation(() => (selection as any))

  const dialogSpy = vi.fn(() => ({ onOk: vi.fn(), onCancel: vi.fn() }))
  const q = { dialog: dialogSpy, dark: { isActive: false } }

  const wrapper = mount(AnnotationPage, { global: { mocks: { $store: store, $q: q }, stubs: { 'info-bar': true } } })

  // call the mixin method selectTokens via component vm
  ;(wrapper.vm as any).selectTokens({ detail: 1 } as MouseEvent)

  expect(dialogSpy).toHaveBeenCalled()
  expect(selection.empty).toHaveBeenCalled()
  getSelSpy.mockRestore()
})
