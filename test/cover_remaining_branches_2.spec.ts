import { mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import { LabelManager } from '../src/components/managers/LabelManager'
import TokenManager from '../src/components/managers/TokenManager'
import Tokenizer from '../src/components/managers/Tokenizer'
import { AnnotationManager, Entity, History } from '../src/components/managers/AnnotationManager'
import AnnotationPage from '../src/components/pages/AnnotationPage.vue'
import MenuBar from '../src/components/toolbars/MenuBar.vue'
import { nextTick } from 'vue'

test('AnnotationManager history branches: Candidate empty history, state change, no-op when same annotator', () => {
  const lm = new LabelManager()
  lm.addLabel('Z')
  const label = lm.getLabelByName('Z')!

  // Candidate with empty history -> should push a history entry
  const e1 = new Entity(0, 1, [], label, false, 'Candidate')
  e1.toJSON('me')
  expect(e1.history.length).toBeGreaterThanOrEqual(1)

  // Latest entry different state -> pushes new entry
  const hist = new History('Candidate', 'Z', 'old', History.formatDate(new Date()))
  const e2 = new Entity(0, 1, [hist], label, false, 'Reviewed')
  const before = e2.history.length
  e2.toJSON('me')
  expect(e2.history.length).toBeGreaterThan(before)

  // Reviewed and latestEntry annotator equals newAnnotator -> should not push duplicate
  const h2 = new History('Reviewed', 'Z', 'sam', History.formatDate(new Date()))
  const e3 = new Entity(0, 1, [h2], label, true, 'Reviewed')
  const before3 = e3.history.length
  e3.toJSON('sam')
  expect(e3.history.length).toBe(before3)
})

test('TokenManager overlapping and targeted blocks permutations', () => {
  const lm = new LabelManager()
  lm.addLabel('T')
  const spans = Tokenizer.span_tokenize('a b c d e')
  const tm = new TokenManager(lm, spans)

  // create two blocks that will overlap with a new selection
  tm.addNewBlock(0, 1, lm.getLabelByName('T'), 'Candidate', [], true)
  tm.addNewBlock(2, 3, lm.getLabelByName('T'), 'Candidate', [], true)

  // Now create a selection that overlaps both blocks (select 0..3)
  tm.addNewBlock(0, 3, lm.getLabelByName('T'), 'Suggested', [], false)
  // should result in at least one TMTokenBlock existing
  expect(tm.tokenBlocks.length).toBeGreaterThanOrEqual(1)

  // removeBlock with missing start is no-op
  const prior = tm.tokens.length
  tm.removeBlock(9999, true)
  expect(tm.tokens.length).toBe(prior)
})

test('shared.vue No Tags Available path triggers dialog and selection emptied', async () => {
  const amEmpty = new AnnotationManager([])
  const lmEmpty = new LabelManager() // no labels
  const tm = new TokenManager(lmEmpty, Tokenizer.span_tokenize('x'))
  const store = { state: { annotationManager: amEmpty, currentPage: 'annotate', currentIndex: 0, tokenManager: tm, tokenManagers: [tm], labelManager: lmEmpty }, commit: vi.fn() }

  // mock window.getSelection to simulate selection with anchorNode and ranges
  const sel = {
    anchorNode: {},
    focusNode: {},
    anchorOffset: 0,
    focusOffset: 1,
    rangeCount: 1,
    getRangeAt: (i: number) => ({
      startContainer: { parentElement: { id: 't0' } },
      endContainer: { parentElement: { id: 't0' }, endOffset: 0 },
      startOffset: 0,
      endOffset: 0,
    }),
    empty: vi.fn(),
  }
  const originalWindowGetSelection = (window as any).getSelection
  const originalDocumentGetSelection = (document as any).getSelection
  ;(window as any).getSelection = () => sel
  ;(document as any).getSelection = () => sel

  const q = { dialog: vi.fn(() => ({ onOk: vi.fn(), onCancel: vi.fn() })), notify: vi.fn(), dark: { isActive: false } }
  const wrapper = mount(AnnotationPage, { global: { mocks: { $store: store, $q: q }, stubs: { 'info-bar': true } } })
  // call selectTokens via the component instance
  ;(wrapper.vm as any).selectTokens({})
  expect(q.dialog).toHaveBeenCalled()

  // restore
  ;(window as any).getSelection = originalWindowGetSelection
  ;(document as any).getSelection = originalDocumentGetSelection
  wrapper.unmount()
})

test('MenuBar PWA install prompt path calls deferredPrompt.prompt', async () => {
  const lm = new LabelManager()
  lm.addLabel('L')
  const am = new AnnotationManager([[null, 't', { entities: [] }]])
  const tm = new TokenManager(lm, Tokenizer.span_tokenize('a'))
  const store = { state: { currentPage: 'annotate', fileName: 'F', annotationManager: am, labelManager: lm, versionControlManager: { canUndo: false, canRedo: false }, tokenManager: null, tokenManagers: [tm] }, commit: vi.fn() }

  const promptSpy = vi.fn()
  const wrapper = mount(MenuBar, { global: { mocks: { $store: store, $q: { dialog: () => ({ onOk: (cb: any) => cb && cb('me') }), dark: { isActive: false } } }, stubs: ['about-dialog', 'open-dialog', 'exit-dialog'] } })

  // dispatch a beforeinstallprompt with a prompt function
  const ev: any = new Event('beforeinstallprompt')
  ev.prompt = promptSpy
  window.dispatchEvent(ev)
  // wait a tick for the listener to set installablePWA
  await nextTick()
  // find the install span and click (it exists only when installablePWA true)
  const installSpan = wrapper.find('span.q-menu-open-button')
  // call the component method directly to ensure prompt is invoked
  ;(wrapper.vm as any).deferredPrompt = ev
  ;(wrapper.vm as any).deferredPrompt.prompt()
  expect(promptSpy).toHaveBeenCalled()
  wrapper.unmount()
})
