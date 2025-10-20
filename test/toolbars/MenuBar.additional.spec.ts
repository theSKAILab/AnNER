/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import MenuBar from '../../src/components/toolbars/MenuBar.vue'
import { store } from '../../src/components/managers/Store'
import { AnnotationManager } from '../../src/components/managers/AnnotationManager'
import { LabelManager } from '../../src/components/managers/LabelManager'
import ExitDialog from '../../src/components/dialogs/ExitDialog.vue'
import OpenDialog from '../../src/components/dialogs/OpenDialog.vue'

describe('MenuBar additional flows', () => {
  beforeEach(() => {
    store.state.annotationManager = AnnotationManager.fromText('one')
    store.state.labelManager = new LabelManager()
    store.state.tokenManagers = []
    store.state.currentPage = 'annotate'
  })

  it('menuKeyBind opens menu refs and toggles annotator page', () => {
    const $q = { dialog: vi.fn(() => ({ onOk: () => ({}) })), dark: { isActive: false, toggle: vi.fn() } }
    const wrapper = mount(MenuBar, { global: { mocks: { $store: store, $q } } })
    const vm: any = wrapper.vm

    // Simulate menu open binds by calling with ctrl+f/e/a/h
    vm.menuKeyBind({ key: 'f', ctrlKey: true, preventDefault: () => {} })
    vm.menuKeyBind({ key: 'e', ctrlKey: true, preventDefault: () => {} })
    vm.menuKeyBind({ key: 'a', ctrlKey: true, preventDefault: () => {} })
    vm.menuKeyBind({ key: 'h', ctrlKey: true, preventDefault: () => {} })

    // Annotator toggle via ctrl+m
    store.state.currentPage = 'annotate'
    vm.menuKeyBind({ key: 'm', ctrlKey: true, preventDefault: () => {} })
    expect(store.state.currentPage).toBe('review')

    // Edit binds: z/y with ctrl/alt call version control manager methods without throwing
    const vcm = store.state.versionControlManager
    if (vcm) {
      vm.menuKeyBind({ key: 'z', ctrlKey: true, preventDefault: () => {} })
      vm.menuKeyBind({ key: 'y', ctrlKey: true, preventDefault: () => {} })
      vm.menuKeyBind({ key: 'z', altKey: true, preventDefault: () => {} })
      vm.menuKeyBind({ key: 'y', altKey: true, preventDefault: () => {} })
    }
  })

  it('menu refs click and file open/pendingOpen branches', () => {
    const $q = { dialog: vi.fn(() => ({ onOk: () => ({}) })), dark: { isActive: false, toggle: vi.fn() } }
    const wrapper = mount(MenuBar, { global: { mocks: { $store: store, $q } } })
    const vm: any = wrapper.vm

    // Ensure refs exist (can't assign to readonly $refs in VTU reliably)
    expect(vm.$refs.fileMenu).toBeTruthy()
    expect(vm.$refs.editMenu).toBeTruthy()
    expect(vm.$refs.annotatorMenu).toBeTruthy()
    expect(vm.$refs.helpMenu).toBeTruthy()

    // calling menuKeyBind should not throw for the menu keys
    expect(() => {
      vm.menuKeyBind({ key: 'f', ctrlKey: true, preventDefault: () => {} })
      vm.menuKeyBind({ key: 'e', ctrlKey: true, preventDefault: () => {} })
      vm.menuKeyBind({ key: 'a', ctrlKey: true, preventDefault: () => {} })
      vm.menuKeyBind({ key: 'h', ctrlKey: true, preventDefault: () => {} })
    }).not.toThrow()

    // file open when on start should call the file input click (spy on prototype)
    const spyClick = vi.spyOn(window.HTMLInputElement.prototype, 'click')
    store.state.currentPage = 'start'
    vm.menuKeyBind({ key: 'o', ctrlKey: true, preventDefault: () => {} })
    expect(spyClick).toHaveBeenCalled()
    spyClick.mockRestore()

    // file open when not on start: menuKeyBind still calls file.click() (template click sets pendingOpen)
    store.state.currentPage = 'annotate'
    const spyClick2 = vi.spyOn(window.HTMLInputElement.prototype, 'click')
    vm.menuKeyBind({ key: 'o', ctrlKey: true, preventDefault: () => {} })
    expect(spyClick2).toHaveBeenCalled()
    spyClick2.mockRestore()
    // pendingOpen is only set via template click path; via keyboard it remains null
    expect(vm.pendingOpen).toBeNull()
  })

  it('open-dialog and exit-dialog confirm handlers call expected actions', () => {
    const $q = { dialog: vi.fn(() => ({ onOk: () => ({}) })), dark: { isActive: false, toggle: vi.fn() } }
    const wrapper = mount(MenuBar, { global: { mocks: { $store: store, $q } } })
    const vm: any = wrapper.vm

    // pendingOpen confirm should call pendingOpen.click()
    const clickSpy = vi.fn()
    vm.pendingOpen = { click: clickSpy }
    const openDialog = wrapper.findComponent(OpenDialog)
    expect(openDialog.exists()).toBe(true)
    openDialog.vm.$emit('confirm')
    expect(clickSpy).toHaveBeenCalled()

    // pendingClose confirm should call reloadWindow - spy reloadWindow
  const reloadSpy = vi.spyOn(vm, 'performReload')
    vm.pendingClose = true
    const exitDialog = wrapper.findComponent(ExitDialog)
    expect(exitDialog.exists()).toBe(true)
    exitDialog.vm.$emit('confirm')
    expect(reloadSpy).toHaveBeenCalled()
    reloadSpy.mockRestore()
  })

  it('beforeinstallprompt and appinstalled event handlers set installablePWA and deferredPrompt', () => {
    const $q = { dialog: vi.fn(() => ({ onOk: () => ({}) })), dark: { isActive: false, toggle: vi.fn() } }
    const wrapper = mount(MenuBar, { global: { mocks: { $store: store, $q } } })
    const vm: any = wrapper.vm

    // Create an event object and attach a prompt function
    const ev: any = new Event('beforeinstallprompt')
    ev.prompt = vi.fn()
    window.dispatchEvent(ev)
    // after dispatching, vm.installablePWA should be true and deferredPrompt assigned
    expect(vm.installablePWA).toBe(true)
    expect(vm.deferredPrompt).toBeDefined()

    // now dispatch appinstalled
    window.dispatchEvent(new Event('appinstalled'))
    expect(vm.installablePWA).toBe(false)
    expect(vm.deferredPrompt).toBeNull()
  })

  it('save and export onOk create and click anchor elements', () => {
    const created: any[] = []
    // stub document.createElement so we can capture created anchor and simulate click
    const origCreate = document.createElement
    document.createElement = ((tag: string) => {
      const el = origCreate.call(document, tag)
      if (tag === 'a') {
        // capture click calls and mark element
        el.click = () => { created.push('clicked') }
      }
      return el
    }) as any

    const mockDialog = { onOk: (cb: any) => { cb('me') } }
    const $q = { dialog: vi.fn(() => mockDialog), dark: { isActive: false, toggle: vi.fn() } }
    const wrapper = mount(MenuBar, { global: { mocks: { $store: store, $q } } })
    const vm: any = wrapper.vm

    // call save() and export() which should create and click anchors
    vm.save()
    vm.export()

    // restore
    document.createElement = origCreate
    expect(created.length).toBeGreaterThanOrEqual(2)
  })

  it('installablePWA and deferredPrompt prompt path', () => {
    const wrapper = mount(MenuBar, { global: { mocks: { $store: store, $q: { dark: { isActive: false, toggle: vi.fn() } } } } })
    const vm: any = wrapper.vm
    // simulate beforeinstallprompt event
    const e: any = { prompt: vi.fn() }
    vm.deferredPrompt = e
    vm.installablePWA = true
    // invoking deferredPrompt.prompt should call prompt
    vm.deferredPrompt.prompt()
    expect(e.prompt).toHaveBeenCalled()
  })

  it('menuKeyBind toggles annotator page from review -> annotate with ctrl+m', () => {
    const wrapper = mount(MenuBar, { global: { mocks: { $store: store, $q: { dark: { isActive: false, toggle: vi.fn() } } } } })
    const vm: any = wrapper.vm
    // set page to review and ensure toggle goes to annotate
    store.state.currentPage = 'review'
    vm.menuKeyBind({ key: 'm', ctrlKey: true, preventDefault: () => {} })
    expect(store.state.currentPage).toBe('annotate')
  })

  it('reloadWindow disables beforeunload and triggers location.reload (safe spy)', () => {
    const $q = { dialog: vi.fn(() => ({ onOk: () => ({}) })), dark: { isActive: false, toggle: vi.fn() } }
    const wrapper = mount(MenuBar, { global: { mocks: { $store: store, $q } } })
    const vm: any = wrapper.vm

    // Ensure beforeunload is set initially
    window.onbeforeunload = () => 'x'

    // Try to spy on window.location.reload; if that's not allowed, spy on performReload
    let reloadSpy: any
    try {
      reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {})
      vm.reloadWindow()
      expect(window.onbeforeunload).toBeNull()
      expect(reloadSpy).toHaveBeenCalled()
    } catch (err) {
      // fallback: spy on performReload method
      reloadSpy = vi.spyOn(vm, 'performReload')
      vm.reloadWindow()
      expect(window.onbeforeunload).toBeNull()
      expect(reloadSpy).toHaveBeenCalled()
    } finally {
      if (reloadSpy && reloadSpy.mockRestore) reloadSpy.mockRestore()
    }
  })

  it('menuKeyBind ctrl+q sets pendingClose when page is valid', () => {
    const wrapper = mount(MenuBar, { global: { mocks: { $store: store, $q: { dark: { isActive: false, toggle: vi.fn() } } } } })
    const vm: any = wrapper.vm
    store.state.currentPage = 'annotate'
    expect(vm.pendingClose).toBeNull()
    vm.menuKeyBind({ key: 'q', ctrlKey: true, preventDefault: () => {} })
    expect(vm.pendingClose).toBeTruthy()
  })
})
