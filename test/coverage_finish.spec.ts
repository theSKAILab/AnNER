import { test, expect, vi } from 'vitest'
import { Entity, History } from '../src/components/managers/AnnotationManager'
import { LabelManager } from '../src/components/managers/LabelManager'
import TokenManager, { TMTokenBlock } from '../src/components/managers/TokenManager'
import AnnotationPage from '../src/components/pages/AnnotationPage.vue'
import ReviewPage from '../src/components/pages/ReviewPage.vue'
import { shallowMount } from '@vue/test-utils'

test('generateHistoryEntryForExport: reviewed + latest entry same state/label but different annotator pushes duplicate', () => {
  const lm = new LabelManager()
  lm.addLabel('D')
  const label = lm.getLabelByName('D')!
  const latest = new History('Suggested', 'D', 'alice', History.formatDate(new Date()))
  const e = new Entity(0, 1, [latest], label, true, 'Suggested')
  // different annotator -> should push duplicate latest
  ;(e as any).generateHistoryEntryForExport('bob')
  expect(e.history.length).toBe(2)
  expect(e.history[1].annotatorName).toBe('bob')
})

test('generateHistoryEntryForExport: latestEntry state differs pushes new entry', () => {
  const lm = new LabelManager()
  lm.addLabel('S')
  const label = lm.getLabelByName('S')!
  const latest = new History('Candidate', 'S', 'x', History.formatDate(new Date()))
  const e = new Entity(0, 2, [latest], label, false, 'Suggested')
  ;(e as any).generateHistoryEntryForExport('y')
  expect(e.history.length).toBe(2)
  expect(e.history[1].state).toBe('Suggested')
})

test('TokenManager constructor imports paragraph entities and increments edited', () => {
  const lm = new LabelManager()
  lm.addLabel('L')
  const label = lm.getLabelByName('L')!
  // create a paragraph-like object with an Entity so constructor will call addBlockFromStructure
  const fakeParagraph: any = { entities: [ { start: 0, end: 1, history: [], labelClass: label, currentState: 'Candidate' } ] }
  const tm = new TokenManager(lm, [[0,1,'a']] as any, fakeParagraph as any)
  // addBlockFromStructure increments edited, so edited should be > 0
  expect(tm.edited).toBeGreaterThanOrEqual(1)
})

test('TokenManager.addNewBlock overlapping path sets overlapped blocks to Rejected when manualState false', () => {
  const lm = new LabelManager()
  lm.addLabel('R')
  const label = lm.getLabelByName('R')!
  const spans = [[0,1,'a'], [1,2,'b'], [2,3,'c']] as any
  const tm = new TokenManager(lm, spans)

  // Create an existing block that overlaps 0..2
  const t0 = tm.tokens[0] as any
  const t1 = tm.tokens[1] as any
  const existing = new TMTokenBlock(0,2,[t0,t1], label, 'Suggested')
  tm.tokens.push(existing)
  tm.tokens.sort((a:any,b:any)=>a.start-b.start)

  tm.addNewBlock(0,2,label,'Candidate',[],false)
  // original overlapped block should have been set to Rejected
  const rejected = tm.tokenBlocks.find(b => b.start === 0 && b.currentState === 'Rejected')
  expect(rejected).toBeDefined()
})

test('mounting AnnotationPage and ReviewPage calls created and beforeUnmount hooks without error', () => {
  const emitter = { on: vi.fn(), off: vi.fn() }
  const annotationManager = { inputSentences: [] }
  const tokenManager = { tokens: [] }
  const global = {
    global: {
      mocks: {
        emitter,
        annotationManager,
        tokenManager,
      }
    }
  }
  // call lifecycle hooks directly with a fake context to avoid full render/computed evaluation
  const fakeThis: any = {
    annotationManager: annotationManager,
    tokenManager: tokenManager,
    tokenManagers: [],
    currentIndex: 0,
    tokenizeCurrentSentence: vi.fn(),
    selectTokens: vi.fn(),
    beforeLeave: vi.fn(),
    emitter,
  }
  ;(AnnotationPage as any).created.call(fakeThis)
  ;(AnnotationPage as any).beforeUnmount.call(fakeThis)
  const fakeThisR: any = { ...fakeThis, annotationManager: { inputSentences: [] } }
  ;(ReviewPage as any).created.call(fakeThisR)
  ;(ReviewPage as any).beforeUnmount.call(fakeThisR)
  expect(emitter.on).toHaveBeenCalled()
})
import { mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import { LabelManager } from '../src/components/managers/LabelManager'
import TokenManager from '../src/components/managers/TokenManager'
import Tokenizer from '../src/components/managers/Tokenizer'
import { AnnotationManager, Entity, History, Paragraph } from '../src/components/managers/AnnotationManager'
import AnnotationPage from '../src/components/pages/AnnotationPage.vue'
import ReviewPage from '../src/components/pages/ReviewPage.vue'

// 1) AnnotationManager: ensure RDF Export duplicate-reviewed branch via toJSON and toRDF
test('AnnotationManager explicit reviewed duplicate-annotator branch and RDF export history push', () => {
  const lm = new LabelManager()
  lm.addLabel('L')
  const label = lm.getLabelByName('L')!

  // Build history where latest entry has same state and label but different annotator
  const h = new History('Reviewed', 'L', 'oldAnnotator', History.formatDate(new Date()))
  const e = new Entity(0, 5, [h], label, true, 'Reviewed')
  const p = new Paragraph('hello world')
  p.entities.push(e)

  // toJSON should invoke generateHistoryEntryForExport and push a duplicate entry for RDF Export later
  e.toJSON('newAnnotator')
  expect(e.history.length).toBeGreaterThanOrEqual(2)

  // toRDF will call generateHistoryEntryForExport('RDF Export') as well
  const rdf = e.toRDF(p, lm)
  expect(typeof rdf).toBe('string')
  // ensure history contains an entry with annotator 'RDF Export'
  expect(e.history.some(h2 => h2.annotatorName === 'RDF Export')).toBe(true)
})

// 2) TokenManager: targetedBlocks + overlapped reinsertion path (exercise indexing and reinsertion)
test('TokenManager targetedBlocks and overlapped reinsertion indexing path', () => {
  const lm = new LabelManager()
  lm.addLabel('T')
  const spans = Tokenizer.span_tokenize('one two three')
  const tm = new TokenManager(lm, spans)

  // Create an imported entity block (structure import)
  const imported = new Entity(0, 1, [], lm.getLabelByName('T'), false, 'Candidate')
  tm.addBlockFromStructure(imported)

  // Add another block overlapping the same area to force overlappedBlocks to be non-null
  // This call should not throw and should create a TMTokenBlock using targetedBlocks[last].end
  tm.addNewBlock(0, 1, lm.getLabelByName('T'), 'Suggested', [], false)

  // Ensure there's at least one token-block present afterwards
  const blocks = tm.tokenBlocks
  expect(blocks.length).toBeGreaterThanOrEqual(1)
})

// 3) Pages: created() should NOT call tokenizeCurrentSentence when inputSentences empty
test('AnnotationPage and ReviewPage created hook does not tokenize when no inputSentences', () => {
  const amEmpty = new AnnotationManager([])
  const lm = new LabelManager()
  lm.addLabel('X')
  const spans = Tokenizer.span_tokenize('a b')
  const tm = new TokenManager(lm, spans)

  const emitter = { on: vi.fn(), off: vi.fn() }
  const store = { state: { annotationManager: amEmpty, currentPage: 'annotate', currentIndex: 0, tokenManager: tm, tokenManagers: [tm], labelManager: lm, versionControlManager: { addUndo: vi.fn() } }, commit: vi.fn() }

  const wrapperA = mount(AnnotationPage, { global: { mocks: { $store: store, emitter }, stubs: { 'info-bar': true } } })
  // with empty inputSentences created() should not call tokenizeCurrentSentence, so commit should not be invoked
  expect(store.commit).toHaveBeenCalledTimes(0)
  wrapperA.unmount()

  const wrapperR = mount(ReviewPage, { global: { mocks: { $store: store, emitter }, stubs: { 'info-bar': true } } })
  expect(store.commit).toHaveBeenCalledTimes(0)
  wrapperR.unmount()
})

// 4) shared.vue overlapping dialog onOk path: ensure onOk callback executes addUndo and addNewBlock
test('shared.vue selectTokens overlapping path invokes dialog.onOk callback', () => {
  const lm = new LabelManager()
  lm.addLabel('Z')
  const spans = Tokenizer.span_tokenize('x y z')
  const tm = new TokenManager(lm, spans)

  // add an imported block to create an overlap condition
  const imported = new Entity(0, 1, [], lm.getLabelByName('Z'), false, 'Candidate')
  tm.addBlockFromStructure(imported)

  const am = new AnnotationManager([])
  const vcm = { addUndo: vi.fn() }
  const store = { state: { annotationManager: am, currentPage: 'annotate', currentIndex: 0, tokenManager: tm, tokenManagers: [tm], labelManager: lm, versionControlManager: vcm }, commit: vi.fn() }

  // stub selection overlapping the imported block
  const sel = {
    anchorNode: {},
    focusNode: {},
    anchorOffset: 0,
    focusOffset: 1,
    rangeCount: 1,
    getRangeAt: (i: number) => ({ startContainer: { parentElement: { id: 't0' } }, endContainer: { parentElement: { id: 't0' }, endOffset: 0 } }),
    empty: vi.fn()
  }
  const docAccessor = document as unknown as { getSelection?: () => unknown }
  const origDocSel = docAccessor.getSelection
  ;(docAccessor as { getSelection?: () => unknown }).getSelection = () => sel

  // dialog returns an object with onOk that immediately runs the callback
  const dialogSpy = vi.fn(() => {
    return { onOk: (cb: unknown) => { if (typeof cb === 'function') (cb as Function)(); return {} } }
  })

  const wrapper = mount(AnnotationPage, { global: { mocks: { $store: store, $q: { dialog: dialogSpy, dark: { isActive: false } } }, stubs: { 'info-bar': true } } })
  // call selectTokens to trigger overlapping dialog path
  ;(wrapper.vm as unknown as { selectTokens: (arg: unknown) => void }).selectTokens({ detail: 1 })

  // versionControlManager.addUndo should have been called via the onOk callback
  expect(vcm.addUndo).toHaveBeenCalled()

  ;(docAccessor as { getSelection?: () => unknown }).getSelection = origDocSel
  wrapper.unmount()
})
