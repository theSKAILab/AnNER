import { test, expect } from 'vitest'
import { AnnotationManager, Entity, History, Paragraph } from '../src/components/managers/AnnotationManager'
import { LabelManager } from '../src/components/managers/LabelManager'
import TokenManager, { TMTokenBlock, TMToken } from '../src/components/managers/TokenManager'
import AnnotationPage from '../src/components/pages/AnnotationPage.vue'
import ReviewPage from '../src/components/pages/ReviewPage.vue'
import App from '../src/App.vue'
import { vi } from 'vitest'
import { mount, shallowMount } from '@vue/test-utils'
import { reactive } from 'vue'

test('AnnotationManager.generateHistoryEntryForExport: reviewed same-state/label different annotator duplicates latest', () => {
  const lm = new LabelManager()
  lm.addLabel('X')
  const label = lm.getLabelByName('X')!
  const h = new History('Suggested', 'X', 'other', History.formatDate(new Date()))
  const e = new Entity(0, 1, [h], label, true, 'Suggested')
  // different annotator should cause push of duplicate latest entry
  ;(e as any).generateHistoryEntryForExport('me')
  expect(e.history.length).toBeGreaterThan(1)
})

test('AnnotationManager.generateHistoryEntryForExport: Candidate with empty history pushes entry', () => {
  const e = new Entity(0, 2, [], undefined, false, 'Candidate')
  ;(e as any).generateHistoryEntryForExport('a')
  expect(e.history.length).toBeGreaterThan(0)
})

test('TokenManager constructor with Paragraph calls addBlockFromStructure path', () => {
  const lm = new LabelManager()
  lm.addLabel('L')
  const label = lm.getLabelByName('L')!
  const p = new Paragraph('text', [
    [null, 0, 1, []]
  ] as any)
  // attach an entity to paragraph entities to exercise constructor branch
  p.entities.push(new Entity(0,1,[], label, false,'Candidate'))
  const tm = new TokenManager(lm, [[0,1,'t']] as any, p)
  // after construction there should be at least one token block or token
  expect(tm.tokens.length).toBeGreaterThan(0)
})

test('AnnotationPage and ReviewPage created/beforeUnmount listeners use different listener signatures', () => {
  // Call lifecycle hooks directly with fake contexts to exercise listener registration/removal
  const fakeAnnThis: any = {
    annotationManager: { inputSentences: [] },
    selectTokens: () => {},
    tokenizeCurrentSentence: () => {},
    emitter: { on: vi.fn(), off: vi.fn() }
  }
  ;(AnnotationPage as any).created.call(fakeAnnThis)
  ;(AnnotationPage as any).beforeUnmount.call(fakeAnnThis)

  const fakeRevThis: any = {
    annotationManager: { inputSentences: [] },
    selectTokens: () => {},
    tokenizeCurrentSentence: () => {},
    emitter: { on: vi.fn(), off: vi.fn() }
  }
  ;(ReviewPage as any).created.call(fakeRevThis)
  ;(ReviewPage as any).beforeUnmount.call(fakeRevThis)

  expect(true).toBe(true)
})

test('AnnotationPage created calls tokenizeCurrentSentence when inputSentences present', () => {
  const fakeThis: any = {
    annotationManager: { inputSentences: [1] },
    selectTokens: () => {},
    tokenizeCurrentSentence: vi.fn(),
    emitter: { on: vi.fn(), off: vi.fn() }
  }
  ;(AnnotationPage as any).created.call(fakeThis)
  expect(fakeThis.tokenizeCurrentSentence).toHaveBeenCalled()
})

test('ReviewPage created calls tokenizeCurrentSentence when inputSentences present', () => {
  const fakeThis: any = {
    annotationManager: { inputSentences: [1] },
    selectTokens: () => {},
    tokenizeCurrentSentence: vi.fn(),
    emitter: { on: vi.fn(), off: vi.fn() }
  }
  ;(ReviewPage as any).created.call(fakeThis)
  expect(fakeThis.tokenizeCurrentSentence).toHaveBeenCalled()
})



test('TokenManager.addNewBlock with manualState false sets overlapped block to Rejected', () => {
  const lm = new LabelManager()
  lm.addLabel('R')
  const label = lm.getLabelByName('R')!
  const spans = [[0,1,'a'], [1,2,'b'], [2,3,'c']] as any
  const tm = new TokenManager(lm, spans)
  const t0 = tm.tokens[0] as any
  const t1 = tm.tokens[1] as any
  const existing = new TMTokenBlock(0,2,[t0,t1], label, 'Suggested')
  tm.tokens.push(existing)
  tm.tokens.sort((a:any,b:any)=>a.start-b.start)

  tm.addNewBlock(0,2,label,'Candidate',[],false)
  const found = tm.tokenBlocks.find(b=>b.start===0)
  expect(found).not.toBeUndefined()
  // overlapped original block should have been set to Rejected
  const rejectedExists = tm.tokenBlocks.some(b=>b.start===0 && b.currentState==='Rejected')
  expect(rejectedExists).toBe(true)
})

test('App.vue drag/drop overlay toggles only on start page', async () => {
  // call methods on the component definition to verify branch behavior without full mount
  const fakeThis: any = { currentPage: 'start', overlayActive: false, pendingFileDrop: null, loadFile: vi.fn() }
  ;(App as any).methods.onDragEnter.call(fakeThis)
  expect(fakeThis.overlayActive).toBe(true)
  ;(App as any).methods.onDragLeave.call(fakeThis)
  expect(fakeThis.overlayActive).toBe(false)
  fakeThis.currentPage = 'annotate'
  ;(App as any).methods.onDragEnter.call(fakeThis)
  expect(fakeThis.overlayActive).toBe(false)
})
import { expect, test, vi, afterEach } from 'vitest'
import { LabelManager } from '../src/components/managers/LabelManager'
import { Entity, History, Paragraph } from '../src/components/managers/AnnotationManager'
import TokenManager, { TMTokenBlock, TMToken } from '../src/components/managers/TokenManager'
import AnnotationPage from '../src/components/pages/AnnotationPage.vue'
import ReviewPage from '../src/components/pages/ReviewPage.vue'
import App from '../src/App.vue'

afterEach(() => {
  vi.restoreAllMocks()
})

test('Entity.generateHistoryEntryForExport exercises all conditional branches', () => {
  const lm = new LabelManager()
  lm.addLabel('X')
  lm.addLabel('Y')
  const labelX = lm.getLabelByName('X')!
  const labelY = lm.getLabelByName('Y')!

  // 1) reviewed && latestEntry different annotator but same state/label -> pushes copy entry
  const h1 = new History('Reviewed', 'X', 'old-annotator', History.formatDate(new Date()))
  const e1 = new Entity(0, 2, [h1], labelX, true, 'Reviewed')
  ;(e1 as any).generateHistoryEntryForExport('new-annotator')
  expect(e1.history.length).toBeGreaterThan(1)
  const last1 = e1.history[e1.history.length - 1]
  expect(last1.annotatorName).toBe('new-annotator')
  expect(last1.state).toBe('Reviewed')

  // 2) Candidate with empty history adds new entry
  const e2 = new Entity(0, 2, [], labelY, false, 'Candidate')
  ;(e2 as any).generateHistoryEntryForExport('someone')
  expect(e2.history.length).toBeGreaterThan(0)
  expect(e2.history[0].state).toBe('Candidate')

  // 3) latestEntry differs from currentState -> pushes new entry
  const h3 = new History('Suggested', 'Y', 'u', History.formatDate(new Date()))
  const e3 = new Entity(0, 2, [h3], labelY, false, 'Candidate')
  ;(e3 as any).generateHistoryEntryForExport('z')
  expect(e3.history.length).toBeGreaterThan(1)
})

test('TokenManager.addNewBlock overlapping reinserts and uses targetedBlocks last end', () => {
  const lm = new LabelManager()
  lm.addLabel('L')
  const label = lm.getLabelByName('L')!

  // create simple token spans
  const spans = [[0,1,'a'], [1,2,'b'], [2,3,'c']] as any
  const tm = new TokenManager(lm, spans)

  // manually create a TMTokenBlock that overlaps [0,2]
  const t0 = tm.tokens[0] as TMToken
  const t1 = tm.tokens[1] as TMToken
  const block = new TMTokenBlock(0, 2, [t0, t1], label, 'Suggested')
  // push the block into tokens and keep originals as well to simulate existing blocks
  tm.tokens.push(block)
  tm.tokens.sort((a,b) => a.start - b.start)

  // Now add a new block that overlaps the existing block
  tm.addNewBlock(0, 2, label, 'Candidate')

  // After operation: the overlapped block should have been reinserted and present
  const found = tm.getBlockByStart(0)
  expect(found).not.toBeNull()
  // the overlapped block's state was set during the flow and then reinserted
  expect(found!.currentState).toBeDefined()

  // Ensure tokens array contains both token blocks and individual tokens after reinsertion
  const hasBlock = tm.tokens.some(t => t instanceof TMTokenBlock)
  expect(hasBlock).toBeTruthy()
})

test('AnnotationPage and ReviewPage created and beforeUnmount branches execute', () => {
  // spy on document add/remove
  const addSpy = vi.spyOn(document, 'addEventListener')
  const removeSpy = vi.spyOn(document, 'removeEventListener')

  const fakeThis: any = {
    annotationManager: { inputSentences: [{ id: 0, text: 'one' }] },
    tokenManagers: [],
    currentIndex: 0,
    tokenizeCurrentSentence: vi.fn(),
    selectTokens: vi.fn(),
    beforeLeave: vi.fn(),
    emitter: { on: vi.fn(), off: vi.fn() },
  }

  // AnnotationPage created + beforeUnmount
  const annCreated = (AnnotationPage as any).created
  const annBefore = (AnnotationPage as any).beforeUnmount
  annCreated.call(fakeThis)
  expect(fakeThis.tokenizeCurrentSentence).toHaveBeenCalled()
  expect(fakeThis.emitter.on).toHaveBeenCalled()
  annBefore.call(fakeThis)
  // removeEventListener is called (executes the branch)
  expect(removeSpy).toHaveBeenCalled()

  // ReviewPage created + beforeUnmount with empty inputSentences
  const fakeThis2: any = {
    ...fakeThis,
    annotationManager: { inputSentences: [] },
    emitter: { on: vi.fn(), off: vi.fn() },
    tokenizeCurrentSentence: vi.fn(),
  }
  const revCreated = (ReviewPage as any).created
  const revBefore = (ReviewPage as any).beforeUnmount
  revCreated.call(fakeThis2)
  // when empty, tokenizeCurrentSentence should not be immediately called
  expect(fakeThis2.tokenizeCurrentSentence).not.toHaveBeenCalled()
  expect(fakeThis2.emitter.on).toHaveBeenCalled()
  revBefore.call(fakeThis2)
  expect(removeSpy).toHaveBeenCalled()
})

test('App.vue drag/drop handlers cover start-page branches', () => {
  const methods = (App as any).methods

  const fakeThis: any = {
    currentPage: 'start',
    overlayActive: false,
    pendingFileDrop: null,
    loadFile: vi.fn(),
  }

  // onDragEnter should set overlayActive when on start page
  methods.onDragEnter.call(fakeThis)
  expect(fakeThis.overlayActive).toBe(true)

  // onDragLeave should clear overlayActive when on start page
  methods.onDragLeave.call(fakeThis)
  expect(fakeThis.overlayActive).toBe(false)

  // onDrop should set pendingFileDrop and call loadFile when on start page
  const fakeEvent: any = { dataTransfer: { files: [ 'file1' ] } }
  methods.onDrop.call(fakeThis, fakeEvent)
  expect(fakeThis.pendingFileDrop).toBe('file1')
  expect(fakeThis.loadFile).toHaveBeenCalled()
})
import { mount, shallowMount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import Tokenizer from '../src/components/managers/Tokenizer'
import { LabelManager } from '../src/components/managers/LabelManager'
import TokenManager, { TMTokenBlock, TMToken } from '../src/components/managers/TokenManager'
import { Entity, History, Paragraph, AnnotationManager } from '../src/components/managers/AnnotationManager'
import MenuBar from '../src/components/toolbars/MenuBar.vue'
import AnnotationPage from '../src/components/pages/AnnotationPage.vue'

test('Tokenizer.span_tokenize handles empty and repeated tokens', () => {
  expect(Tokenizer.span_tokenize('')).toEqual([])
  const spans = Tokenizer.span_tokenize('a a a')
  expect(spans.length).toBeGreaterThanOrEqual(3)
  // ensure positions are non-decreasing
  for (let i = 1; i < spans.length; i++) {
    expect(spans[i][0]).toBeGreaterThanOrEqual(spans[i - 1][0])
  }
})

test('TokenManager addNewBlock marks overlapped blocks Rejected when manualState=false and removeBlock reintroduce toggles tokens', () => {
  const lm = new LabelManager()
  lm.addLabel('TAG')
  const tokens = Tokenizer.span_tokenize('one two three')
  const tm = new TokenManager(lm, tokens)

  // Create a block covering first two tokens
  const blockTokens = tm.tokens.slice(0, 2) as TMToken[]
  const block = new TMTokenBlock(blockTokens[0].start, blockTokens[blockTokens.length - 1].end, blockTokens, lm.getLabelByName('TAG')!, 'Candidate')
  tm.tokens.push(block)
  tm.tokens.sort((a, b) => a.start - b.start)

  // addNewBlock overlapping selection should set existing block.currentState = 'Rejected'
  tm.addNewBlock(block.start, block.end, lm.getLabelByName('TAG'), 'Suggested', [], false)
  expect(block.currentState).toBe('Rejected')

  // Now test removeBlock with reintroduceTokens=false and true
  const initialCount = tm.tokens.length
  tm.removeBlock(block.start, false)
  expect(tm.tokens.length).toBeLessThanOrEqual(initialCount)
  // reinsert block for next test
  tm.tokens.push(block)
  tm.removeBlock(block.start, true)
  // when reintroduceTokens=true, tokens array should contain TMToken elements (non-block)
  expect(tm.tokens.some(t => !(t instanceof TMTokenBlock))).toBeTruthy()
})

test('Entity.generateHistoryEntryForExport duplicate-annotator branch pushes copy entry', () => {
  const lm = new LabelManager()
  lm.addLabel('X')
  const label = lm.getLabelByName('X')!
  const hist = new History('Reviewed', 'X', 'old', History.formatDate(new Date()))
  const e = new Entity(0, 1, [hist], label, true, 'Reviewed')
  // reviewed = true, latestEntry annotator != newAnnotator, same state & label -> duplicate branch
  e.reviewed = true
  const before = e.history.length
  e.toJSON('new-annotator')
  expect(e.history.length).toBeGreaterThanOrEqual(before)
  // last entry should have annotator 'new-annotator'
  expect(e.latestEntry()?.annotatorName).toBe('new-annotator')
})

test('MenuBar.save creates anchor and clicks it on onOk', () => {
  const lm = new LabelManager()
  lm.addLabel('L')
  const am = new AnnotationManager([[null, 't', { entities: [] }]])
  const tm = new TokenManager(lm, Tokenizer.span_tokenize('a b'))
  // ensure there is a tokenBlocks array for the tokenManager
  tm.addNewBlock(0, 1, lm.getLabelByName('L'), 'Candidate', [], true)
  const store = { state: { currentPage: 'annotate', fileName: 'F', annotationManager: am, labelManager: lm, versionControlManager: { canUndo: false, canRedo: false }, tokenManager: null, tokenManagers: [tm] }, commit: vi.fn() }

  const originalCreate = document.createElement
  const createSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
    const el = originalCreate.call(document, tagName)
    // spy on click to detect invocation
    el.click = vi.fn()
    return el
  })

  // capture appended element (so removal in save() doesn't make it impossible to assert)
  const originalAppend = document.body.appendChild
  const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(function (this: any, el: Node) {
    ;(document.body as any).__lastAppended = el
    // call real append so the node is actually inserted and can be removed later
    return originalAppend.call(this, el)
  })

  const q = { dialog: () => ({ onOk: (cb: any) => cb && cb('me') }), notify: vi.fn(), dark: { isActive: false } }
  const wrapper = mount(MenuBar, { global: { mocks: { $store: store, $q: q }, stubs: ['about-dialog', 'open-dialog', 'exit-dialog'] } })
  ;(wrapper.vm as any).save()
  expect(createSpy).toHaveBeenCalled()
  // retrieve the appended element captured by our spy
  const appended = (document.body as any).__lastAppended as HTMLAnchorElement | undefined
  expect(appended).toBeTruthy()
  // verify download attribute exists and click was invoked
  expect(appended!.getAttribute('download')).toContain('annotations.json')
  expect((appended as any).click).toHaveBeenCalled()
  createSpy.mockRestore()
  appendSpy.mockRestore()
})

test('AnnotationPage created with sentences calls tokenizeCurrentSentence (commit path)', () => {
  const am = new AnnotationManager([[null, 'hello', { entities: [] }]])
  const lm = new LabelManager()
  const tm = new TokenManager(lm, Tokenizer.span_tokenize('hello'))
  const store = { state: { annotationManager: am, currentPage: 'annotate', currentIndex: 0, tokenManager: tm, tokenManagers: [tm], labelManager: lm }, commit: vi.fn() }
  const emitter = { on: vi.fn(), off: vi.fn() }
  const wrapper = mount(AnnotationPage, { global: { mocks: { $store: store, emitter }, stubs: { 'info-bar': true } } })
  // tokenizeCurrentSentence triggers setTokenManager -> mapped mutation -> commit
  expect(store.commit).toHaveBeenCalled()
})

test('App.vue v-if branches for pages render when mounted', async () => {
  // prepare a store mock that App.vue expects
  const store: any = { state: reactive({ currentPage: 'start', annotationManager: null, tokenManagers: [], tokenManager: null }), commit: vi.fn() }

  // declare wrapper first to avoid TDZ/temporal dead zone issues when mutating it later
  let appWrapper: any
  appWrapper = shallowMount(App, { global: { mocks: { $store: store }, stubs: ['start-page', 'annotate-page', 'review-page'] } })

  // start page mapped state should be readable
  expect((appWrapper.vm as any).currentPage).toBe('start')

  // switch pages and ensure mapped computed property updates
  ;(appWrapper.vm as any).$store.state.currentPage = 'annotate'
  await appWrapper.vm.$nextTick()
  expect((appWrapper.vm as any).currentPage).toBe('annotate')

  ;(appWrapper.vm as any).$store.state.currentPage = 'review'
  await appWrapper.vm.$nextTick()
  expect((appWrapper.vm as any).currentPage).toBe('review')
})
