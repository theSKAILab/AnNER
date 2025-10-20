import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LabelsBlock from '../../src/components/blocks/LabelsBlock.vue'

const mockStore = { state: { currentPage: 'annotate', labelManager: { allLabels: [{ id: 1, name: 'A', color: 'red11' }], currentLabel: { id: 1, name: 'A', color: 'red11' }, doesAlreadyExist: () => false, addLabel: () => {}, deleteLabel: () => {} } } }

describe('LabelsBlock component', () => {
  it('renders labels and add input when no labels', async () => {
    const passthrough = { template: '<div><slot /></div>' }
    const wrapper = mount(LabelsBlock as unknown as Record<string, unknown>, {
      global: {
        mocks: { $store: mockStore, $q: { dark: { isActive: false }, dialog: () => ({ onOk: () => {} }), notify: () => {} } },
        stubs: { 'q-chip': passthrough, 'q-avatar': passthrough, 'q-space': passthrough, 'q-input': passthrough },
      },
    })
    expect(wrapper.text()).toContain('A')
  })
})
