import { mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import { LabelManager } from '../src/components/managers/LabelManager'
import TokenManager from '../src/components/managers/TokenManager'
import Tokenizer from '../src/components/managers/Tokenizer'
import { AnnotationManager, Entity, History, Paragraph } from '../src/components/managers/AnnotationManager'
import AnnotationPage from '../src/components/pages/AnnotationPage.vue'
import ReviewPage from '../src/components/pages/ReviewPage.vue'

test('Entity.generateHistoryEntryForExport does not duplicate when annotator equals latestEntry', () => {
  const lm = new LabelManager()
  lm.addLabel('Same')
  const label = lm.getLabelByName('Same')!

  const h = new History('Reviewed', 'Same', 'sameUser', History.formatDate(new Date()))
  const e = new Entity(0, 2, [h], label, true, 'Reviewed')

  // toJSON with same annotator should NOT add another history entry via duplicate branch
  e.toJSON('sameUser')
  // history length should remain 1 because annotator matched
  expect(e.history.length).toBe(1)
})

test('Pages created hook tokenization when annotationManager has sentences', () => {
  const am = AnnotationManager.fromText('one\ntwo') // two sentences -> inputSentences length > 0
  const lm = new LabelManager()
  lm.addLabel('L')
  const spans = Tokenizer.span_tokenize('a b')
  const tm = new TokenManager(lm, spans)

  const emitter = { on: vi.fn(), off: vi.fn() }
  const store = { state: { annotationManager: am, currentPage: 'annotate', currentIndex: 0, tokenManager: tm, tokenManagers: [tm], labelManager: lm, versionControlManager: { addUndo: vi.fn() } }, commit: vi.fn() }

  const wrapperA = mount(AnnotationPage, { global: { mocks: { $store: store, emitter }, stubs: { 'info-bar': true } } })
  // created() should have called tokenizeCurrentSentence -> commit called
  expect(store.commit).toHaveBeenCalled()
  wrapperA.unmount()

  const wrapperR = mount(ReviewPage, { global: { mocks: { $store: store, emitter }, stubs: { 'info-bar': true } } })
  expect(store.commit).toHaveBeenCalled()
  wrapperR.unmount()
})

test('shared.vue selectTokens No Tags Available branch (explicit)', () => {
  const amEmpty = new AnnotationManager([])
  const lmEmpty = new LabelManager()
  const tm = new TokenManager(lmEmpty, Tokenizer.span_tokenize('x y'))
  const vcm = { addUndo: vi.fn() }
  const store = { state: { annotationManager: amEmpty, currentPage: 'annotate', currentIndex: 0, tokenManager: tm, tokenManagers: [tm], labelManager: lmEmpty, versionControlManager: vcm }, commit: vi.fn() }

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

  const dialogSpy = vi.fn(() => ({ onOk: () => {}, onCancel: () => {} }))
  const wrapper = mount(AnnotationPage, { global: { mocks: { $store: store, $q: { dialog: dialogSpy, dark: { isActive: false } } }, stubs: { 'info-bar': true } } })
  ;(wrapper.vm as unknown as { selectTokens: (arg: unknown) => void }).selectTokens({ detail: 1 })

  // dialog should be invoked because there are no labels (lastId == 0)
  expect(dialogSpy).toHaveBeenCalled()

  ;(docAccessor as { getSelection?: () => unknown }).getSelection = origDocSel
  wrapper.unmount()
})
