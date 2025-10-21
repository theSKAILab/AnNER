import { test, expect, vi, afterEach } from 'vitest'
import MenuBar from '../../src/components/toolbars/MenuBar.vue'
import { shallowMount } from '@vue/test-utils'

afterEach(() => vi.restoreAllMocks())

test('menuKeyBind handles various key combos and reloadWindow calls performReload', () => {
  const store: any = { state: { currentPage: 'annotate', fileName: 'file', tokenManager: {}, tokenManagers: [], annotationManager: { annotations: [] }, versionControlManager: { canUndo: true, canRedo: true, undo: vi.fn(), redo: vi.fn(), undoAll: vi.fn(), redoAll: vi.fn() }, labelManager: { toJSON: vi.fn() } } }
  const q = { dark: { toggle: vi.fn(), isActive: false } }
  const vm = shallowMount(MenuBar, { global: { mocks: { $store: store, $q: q } } })

  // test toggleDarkMode calls q.dark.toggle
  ;(vm.vm as any).toggleDarkMode()
  expect(q.dark.toggle).toHaveBeenCalled()

  // test reloadWindow delegates to performReload
  const spy = vi.spyOn(vm.vm as any, 'performReload')
  ;(vm.vm as any).reloadWindow()
  expect(spy).toHaveBeenCalled()

  // menuKeyBind - simulate ctrl+z undo
  const e: any = { key: 'z', ctrlKey: true, altKey: false, preventDefault: vi.fn(), refs: {} }
  ;(vm.vm as any).menuKeyBind(e)
  // should have called versionControlManager.undo
  expect(store.state.versionControlManager.undo).toHaveBeenCalledWith(store.state.tokenManager)
})
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
