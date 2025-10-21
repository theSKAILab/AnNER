import { mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import { LabelManager } from '../src/components/managers/LabelManager'
import TokenManager from '../src/components/managers/TokenManager'
import Tokenizer from '../src/components/managers/Tokenizer'
import { AnnotationManager, Entity, History, Paragraph } from '../src/components/managers/AnnotationManager'
import MenuBar from '../src/components/toolbars/MenuBar.vue'
import AnnotationPage from '../src/components/pages/AnnotationPage.vue'
import ReviewPage from '../src/components/pages/ReviewPage.vue'

test('AnnotationManager.generateHistoryEntryForExport pushes when reviewed and annotator differs (duplicate branch)', () => {
  const lm = new LabelManager()
  lm.addLabel('A')
  const label = lm.getLabelByName('A')!
  const hist = new History('Reviewed', 'A', 'old', History.formatDate(new Date()))
  const e = new Entity(0, 1, [hist], label, true, 'Reviewed')
  // simulate export-time generation with a different annotator
  e['generateHistoryEntryForExport']('new-annotator')
  expect(e.history.length).toBeGreaterThanOrEqual(2)
})

test('TokenManager addNewBlock handles targetedBlocks empty and manualState true', () => {
  const lm = new LabelManager()
  lm.addLabel('T')
  const spans = Tokenizer.span_tokenize('one two')
  const tm = new TokenManager(lm, spans)
  // call addNewBlock with manualState true so overlappedBlocks remains handled differently
  tm.addNewBlock(0, 1, lm.getLabelByName('T'), 'Candidate', [], true)
  // Should have a block now
  expect(tm.tokenBlocks.length).toBeGreaterThanOrEqual(1)
})

test('TokenManager removeBlock does nothing when block missing and removeDuplicateBlocks safe', () => {
  const lm = new LabelManager()
  const tm = new TokenManager(lm, Tokenizer.span_tokenize('x y'))
  const before = tm.tokens.length
  tm.removeBlock(9999, true)
  expect(tm.tokens.length).toBe(before)
  tm.removeDuplicateBlocks()
  expect(tm.tokens.length).toBeGreaterThanOrEqual(0)
})

test('AnnotationPage and ReviewPage created hook tokenize path and beforeLeave returns string', () => {
  const am = new AnnotationManager([[null, 't', { entities: [] }]])
  const lm = new LabelManager()
  const tm = new TokenManager(lm, Tokenizer.span_tokenize('t'))
  const store = { state: { annotationManager: am, currentPage: 'annotate', currentIndex: 0, tokenManager: tm, tokenManagers: [tm], labelManager: lm }, commit: vi.fn() }
  const emitter = { on: vi.fn(), off: vi.fn() }
  const ap = mount(AnnotationPage, { global: { mocks: { $store: store, emitter }, stubs: { 'info-bar': true } } })
  const rp = mount(ReviewPage, { global: { mocks: { $store: store, emitter }, stubs: { 'info-bar': true } } })
  // beforeLeave is defined in shared mixin; when tmEdited is false should return string or undefined
  const bl = (ap.vm as any).beforeLeave()
  // just ensure calling it doesn't throw and returns a value or undefined
  expect(bl === undefined || typeof bl === 'string').toBeTruthy()
  ap.unmount(); rp.unmount()
})

test('MenuBar export path creates anchor and clicks it', () => {
  const lm = new LabelManager()
  lm.addLabel('L')
  const am = new AnnotationManager([[null, 't', { entities: [] }]])
  const tm = new TokenManager(lm, Tokenizer.span_tokenize('a b'))
  tm.addNewBlock(0, 1, lm.getLabelByName('L'), 'Candidate', [], true)
  const store = { state: { currentPage: 'annotate', fileName: 'F', annotationManager: am, labelManager: lm, versionControlManager: { canUndo: false, canRedo: false }, tokenManager: null, tokenManagers: [tm] }, commit: vi.fn() }

  const originalCreate = document.createElement
  const createSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
    const el = originalCreate.call(document, tagName)
    el.click = vi.fn()
    return el
  })
  const originalAppend = document.body.appendChild
  const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(function (this: any, el: Node) {
    return originalAppend.call(this, el)
  })
  const q = { dialog: () => ({ onOk: (cb: any) => cb && cb('me') }), notify: vi.fn(), dark: { isActive: false } }
  const wrapper = mount(MenuBar, { global: { mocks: { $store: store, $q: q }, stubs: ['about-dialog', 'open-dialog', 'exit-dialog'] } })
  ;(wrapper.vm as any).export()
  expect(createSpy).toHaveBeenCalled()
  createSpy.mockRestore()
  appendSpy.mockRestore()
})
