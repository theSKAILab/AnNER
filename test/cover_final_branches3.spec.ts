import { mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import Tokenizer from '../src/components/managers/Tokenizer'
import { LabelManager } from '../src/components/managers/LabelManager'
import TokenManager, { TMTokenBlock, TMToken } from '../src/components/managers/TokenManager'
import { Entity, History, Paragraph, AnnotationManager } from '../src/components/managers/AnnotationManager'
import AnnotationPage from '../src/components/pages/AnnotationPage.vue'
import ReviewPage from '../src/components/pages/ReviewPage.vue'

test('AnnotationManager duplicate-annotator branch pushes copy with latest state/label', () => {
  const lm = new LabelManager()
  lm.addLabel('Z')
  const label = lm.getLabelByName('Z')!
  const hist = new History('Reviewed', 'Z', 'old-annotator', History.formatDate(new Date()))
  const e = new Entity(0, 2, [hist], label, true, 'Reviewed')

  const beforeLen = e.history.length
  e.toJSON('new-annotator')
  expect(e.history.length).toBeGreaterThan(beforeLen)
  const pushed = e.latestEntry()
  expect(pushed).toBeTruthy()
  // ensure the pushed entry uses latestEntry state/label
  expect(pushed!.state).toBe(hist.state)
  expect(pushed!.label).toBe(hist.label)
  expect(pushed!.annotatorName).toBe('new-annotator')
})

test('TokenManager.addNewBlock accesses targetedBlocks[last].end when spanning multiple tokens', () => {
  const lm = new LabelManager()
  lm.addLabel('T')
  const tokens = Tokenizer.span_tokenize('one two three four')
  const tm = new TokenManager(lm, tokens)

  // create two blocks covering different token ranges
  const blockA_tokens = tm.tokens.slice(0, 2) as TMToken[]
  const blockB_tokens = tm.tokens.slice(2, 4) as TMToken[]
  const blockA = new TMTokenBlock(blockA_tokens[0].start, blockA_tokens[blockA_tokens.length - 1].end, blockA_tokens, lm.getLabelByName('T')!, 'Candidate')
  const blockB = new TMTokenBlock(blockB_tokens[0].start, blockB_tokens[blockB_tokens.length - 1].end, blockB_tokens, lm.getLabelByName('T')!, 'Candidate')
  tm.tokens.push(blockA, blockB)
  tm.tokens.sort((a,b)=>a.start - b.start)

  // Now add a new block that spans from start of blockA to end of blockB
  const selectionStart = blockA.start
  const selectionEnd = blockB.end
  tm.addNewBlock(selectionStart, selectionEnd, lm.getLabelByName('T'), 'Suggested', [], false)

  // There should be a TMTokenBlock that starts at selectionStart
  const created = tm.tokenBlocks.find(tb => tb.start === selectionStart)
  expect(created).toBeDefined()
  // Its end should be at least selectionEnd (constructed from targetedBlocks[last].end)
  expect(created!.end).toBeGreaterThanOrEqual(selectionEnd)
})

test('selectTokens uses Candidate when currentPage==annotate and Suggested otherwise', () => {
  const lm = new LabelManager()
  lm.addLabel('LAB')
  const tokens = Tokenizer.span_tokenize('a b')
  const tm1 = new TokenManager(lm, tokens)
  const tm2 = new TokenManager(lm, tokens)

  // spy on addNewBlock
  const spy1 = vi.spyOn(tm1, 'addNewBlock')
  const spy2 = vi.spyOn(tm2, 'addNewBlock')

  // fake selection and getSelection
  const fakeRange = { startContainer: { parentElement: { id: 't0' } }, startOffset: 0, endContainer: { parentElement: { id: 't0' } }, endOffset: 1 }
  const selection = { anchorOffset: 0, focusOffset: 1, anchorNode: {}, focusNode: {}, rangeCount: 1, getRangeAt: (i: number) => fakeRange, empty: vi.fn() }
  const getSelSpy = vi.spyOn(document, 'getSelection' as any).mockImplementation(() => (selection as any))

  const storeA = { state: { annotationManager: new AnnotationManager([[null,'t',{entities:[]}]]), currentPage: 'annotate', currentIndex: 0, tokenManager: tm1, tokenManagers: [tm1], labelManager: lm, versionControlManager: { addUndo: vi.fn() } }, commit: vi.fn() }
  const wrapperA = mount(AnnotationPage, { global: { mocks: { $store: storeA }, stubs: { 'info-bar': true } } })
  ;(wrapperA.vm as any).selectTokens({ detail: 1 } as MouseEvent)
  expect(spy1).toHaveBeenCalled()
  // check that the 4th arg (currentState) passed was 'Candidate'
  expect(spy1.mock.calls[0][3]).toBe('Candidate')

  const storeR = { state: { annotationManager: new AnnotationManager([[null,'t',{entities:[]}]]), currentPage: 'review', currentIndex: 0, tokenManager: tm2, tokenManagers: [tm2], labelManager: lm, versionControlManager: { addUndo: vi.fn() } }, commit: vi.fn() }
  const wrapperR = mount(AnnotationPage, { global: { mocks: { $store: storeR }, stubs: { 'info-bar': true } } })
  ;(wrapperR.vm as any).selectTokens({ detail: 1 } as MouseEvent)
  expect(spy2).toHaveBeenCalled()
  expect(spy2.mock.calls[0][3]).toBe('Suggested')

  getSelSpy.mockRestore()
})

test('AnnotationPage and ReviewPage templates render token, aggregate and token-block variants', () => {
  const lm = new LabelManager()
  lm.addLabel('L')
  const tokens = Tokenizer.span_tokenize('one two three')
  const tm = new TokenManager(lm, tokens)
  // Add a block to force token-block render
  const blockTokens = tm.tokens.slice(0,2) as TMToken[]
  const block = new TMTokenBlock(blockTokens[0].start, blockTokens[blockTokens.length-1].end, blockTokens, lm.getLabelByName('L')!, 'Candidate')
  tm.tokens.push(block)
  tm.tokens.sort((a,b)=>a.start - b.start)

  const am = new AnnotationManager([[null, 'p', { entities: [] }]])
  const store = { state: { annotationManager: am, currentPage: 'annotate', currentIndex: 0, tokenManager: tm, tokenManagers: [tm], labelManager: lm, versionControlManager: { addUndo: vi.fn() } }, commit: vi.fn() }

  const a = mount(AnnotationPage, { global: { mocks: { $store: store }, stubs: { 'info-bar': true } } })
  const r = mount(ReviewPage, { global: { mocks: { $store: store, emitter: { on: vi.fn(), off: vi.fn() } }, stubs: { 'info-bar': true } } })

  // assert that HTML includes rendered token items and annotated block markup
  expect(a.findAll('.token').length).toBeGreaterThan(0)
  expect(r.findAll('.token').length).toBeGreaterThan(0)
  // annotated blocks render as <mark> elements in the template
  expect(a.html()).toContain('<mark')
  expect(r.html()).toContain('<mark')
})
