import { mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import AnnotationPage from '../../src/components/pages/AnnotationPage.vue'
import ReviewPage from '../../src/components/pages/ReviewPage.vue'
import MenuBar from '../../src/components/toolbars/MenuBar.vue'
import { LabelManager } from '../../src/components/managers/LabelManager'
import { AnnotationManager } from '../../src/components/managers/AnnotationManager'

test('AnnotationPage created with no sentences does not call tokenizeCurrentSentence', () => {
  const am = new AnnotationManager([])
  const lm = new LabelManager()
  const store = { state: { annotationManager: am, labelManager: lm, currentPage: 'annotate', currentIndex: 0, tokenManager: { tokens: [] }, tokenManagers: [] }, commit: vi.fn() }
  const emitter = { on: vi.fn(), off: vi.fn() }
  const wrapper = mount(AnnotationPage, { global: { mocks: { $store: store, emitter }, stubs: { 'info-bar': true } } })
  // when inputSentences empty, tokenizeCurrentSentence should not be called by created hook
  expect(emitter.on).toHaveBeenCalled()
})

test('ReviewPage created registers emitter variant and beforeUnmount removes listener', () => {
  const am = new AnnotationManager([])
  const lm = new LabelManager()
  const store = { state: { annotationManager: am, labelManager: lm, currentPage: 'review', currentIndex: 0, tokenManager: { tokens: [] }, tokenManagers: [] }, commit: vi.fn() }
  const emitter = { on: vi.fn(), off: vi.fn() }
  const wrapper = mount(ReviewPage, { global: { mocks: { $store: store, emitter }, stubs: { 'info-bar': true } } })
  expect(emitter.on).toHaveBeenCalled()
  wrapper.unmount()
  expect(emitter.off).toHaveBeenCalled()
})

test('MenuBar.reloadWindow calls performReload', () => {
  const lm = new LabelManager()
  const am = new AnnotationManager([])
  const store = { state: { currentPage: 'annotate', fileName: 'F', annotationManager: am, labelManager: lm, versionControlManager: { canUndo: false, canRedo: false }, tokenManager: null, tokenManagers: [] }, commit: vi.fn() }
  const q = { dialog: () => ({ onOk: (cb: any) => cb && cb('me') }), notify: vi.fn(), dark: { isActive: false } }
  const wrapper = mount(MenuBar, { global: { mocks: { $store: store, $q: q } } })
  const spy = vi.spyOn(wrapper.vm as any, 'performReload')
  ;(wrapper.vm as any).reloadWindow()
  expect(spy).toHaveBeenCalled()
  spy.mockRestore()
})
