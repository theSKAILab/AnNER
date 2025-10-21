import { mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import AnnotationPage from '../../src/components/pages/AnnotationPage.vue'
import ReviewPage from '../../src/components/pages/ReviewPage.vue'
import { LabelManager } from '../../src/components/managers/LabelManager'

const baseStore = {
  state: {
    tokenManager: { tokens: [] },
  annotationManager: { inputSentences: [{ id: 0, text: 'hello' }], annotations: [{ entities: [] }] },
    labelManager: new LabelManager([]),
    tokenManagers: [],
    versionControlManager: { addUndo: () => {} },
    currentIndex: 0,
    currentPage: 'annotate',
  },
  // provide a commit function so mapped mutations (mapMutations) can call through in components
  commit: vi.fn(),
}

const baseMocks = {
  $q: { dialog: () => ({ onOk: () => {} }), dark: { isActive: false } },
  emitter: { on: vi.fn(), off: vi.fn() },
  $store: baseStore,
}

test('AnnotationPage created registers emitter and mouseup listener', () => {
  const wrapper = mount(AnnotationPage, { global: { mocks: baseMocks } })
  expect(baseMocks.emitter.on).toHaveBeenCalled()
  wrapper.unmount()
  expect(baseMocks.emitter.off).toHaveBeenCalled()
})

test('ReviewPage uses emitter with argument variant and cleans up', () => {
  const wrapper = mount(ReviewPage, { global: { mocks: baseMocks } })
  // created should register
  expect(baseMocks.emitter.on).toHaveBeenCalled()
  wrapper.unmount()
  // beforeUnmount should call off
  expect(baseMocks.emitter.off).toHaveBeenCalled()
})
