import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import InfoBar from '../../src/components/toolbars/InfoBar.vue'

const mockStore = {
  state: { currentIndex: 0, annotationManager: { inputSentences: [{ id: 0, text: 'x' }], annotations: [{ entities: [] }] } },
  commit: () => {},
}

describe('InfoBar component', () => {
  it('renders counts', () => {
    const wrapper = mount(InfoBar as any, {
      global: {
        mocks: { $store: mockStore, $q: { dark: { isActive: false } } },
      },
    })
    expect(wrapper.text()).toContain('Words')
  })
})
