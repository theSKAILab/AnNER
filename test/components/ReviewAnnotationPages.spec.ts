import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ReviewPage from '../../src/components/pages/ReviewPage.vue'
import AnnotationPage from '../../src/components/pages/AnnotationPage.vue'

const emitter = { on: vi.fn(), off: vi.fn(), emit: vi.fn() }

const tokenManager = {
  tokens: [],
  edited: [],
  getBlockByStart: () => null,
}

const store = {
  state: {
    annotationManager: { inputSentences: [{ id: 0, text: 'a' }], annotations: [{ entities: [] }] },
    tokenManager,
    tokenManagers: [tokenManager],
    currentPage: 'annotate',
  },
  commit: vi.fn(),
}

describe('Review and Annotation pages', () => {
  it('mounts ReviewPage and hooks emitter', () => {
    const wrapper = mount(ReviewPage as unknown as Record<string, unknown>, { global: { mocks: { $store: store, emitter }, stubs: { 'labels-block': true, 'token': true, 'aggregate-block': true, 'token-block': true, 'info-bar': true } } })
    expect(wrapper.exists()).toBe(true)
    expect(emitter.on).toHaveBeenCalled()
  })

  it('mounts AnnotationPage and hooks emitter', () => {
    const wrapper = mount(AnnotationPage as unknown as Record<string, unknown>, { global: { mocks: { $store: store, emitter }, stubs: { 'labels-block': true, 'token': true, 'aggregate-block': true, 'token-block': true, 'info-bar': true } } })
    expect(wrapper.exists()).toBe(true)
    expect(emitter.on).toHaveBeenCalled()
  })
})
