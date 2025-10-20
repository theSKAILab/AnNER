import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MenuBar from '../../src/components/toolbars/MenuBar.vue'

const mockStore = {
  state: { currentPage: 'start', fileName: 'f' },
  commit: () => {},
}

describe('MenuBar component', () => {
  it('mounts and shows File label', () => {
    const wrapper = mount(MenuBar as any, {
      global: {
        mocks: {
          $store: mockStore,
          $q: { dark: { isActive: false, toggle: () => {} }, dialog: () => ({ onOk: () => {} }) },
        },
        stubs: {
          OpenDialog: true,
          ExitDialog: true,
          AboutDialog: true,
        },
      },
    })
    expect(wrapper.text()).toContain('File')
  })
})
