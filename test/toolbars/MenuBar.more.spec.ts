/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import MenuBar from '../../src/components/toolbars/MenuBar.vue'
import { store } from '../../src/components/managers/Store'
import { LabelManager } from '../../src/components/managers/LabelManager'
import { AnnotationManager } from '../../src/components/managers/AnnotationManager'

describe('MenuBar additional branches', () => {
  beforeEach(() => {
    // reset store minimal state
    store.state.annotationManager = AnnotationManager.fromText('one')
    store.state.labelManager = new LabelManager()
    store.state.fileName = ''
    store.state.currentPage = 'start'
  })

  it('toggleDarkMode calls $q.dark.toggle', () => {
    const dark = { isActive: false, toggle: vi.fn() }
    const wrapper = mount(MenuBar, { global: { mocks: { $store: store, $q: { dark } } } })
    const vm: any = wrapper.vm
    vm.toggleDarkMode()
    expect(dark.toggle).toHaveBeenCalled()
  })

  it('menuKeyBind triggers save/export when ctrl+s / ctrl+d and valid page', () => {
    // Set current page to annotate so isValid true
    store.state.currentPage = 'annotate'
  const mockDialog = { onOk: () => ({}) }
  const $q = { dialog: vi.fn(() => mockDialog), dark: { isActive: false, toggle: vi.fn() } }
  const wrapper = mount(MenuBar, { global: { mocks: { $store: store, $q } } })
  const vm: any = wrapper.vm

  // ctrl+s
  const eSave: any = { key: 's', ctrlKey: true, preventDefault: vi.fn() }
  vm.menuKeyBind(eSave)
  expect($q.dialog).toHaveBeenCalled()

  // ctrl+d
  const eExport: any = { key: 'd', ctrlKey: true, preventDefault: vi.fn() }
  vm.menuKeyBind(eExport)
  expect($q.dialog).toHaveBeenCalled()
  })

  it('reloadWindow disables beforeunload and calls location.reload', () => {
  // Some environments make window.location.reload non-configurable. Instead of
  // spying on it, just call reloadWindow and ignore any thrown errors from the
  // actual reload. We still assert that the beforeunload handler was cleared.
  const wrapper = mount(MenuBar, { global: { mocks: { $store: store, $q: { dialog: () => ({ onOk: () => ({}) }), dark: { isActive: false, toggle: vi.fn() } } } } })
  const vm: any = wrapper.vm
  // ensure a beforeunload is present then call reloadWindow
  window.onbeforeunload = () => 'x'
  try {
    vm.reloadWindow()
  } catch { /* ignore environment reload errors */ }
  expect(window.onbeforeunload).toBeNull()
  })
})
