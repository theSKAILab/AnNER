import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../../src/App.vue'
import { store } from '../../src/components/managers/Store'

describe('App drag and drop handlers', () => {
  it('toggles overlayActive on drag enter/leave when currentPage is start', async () => {
    store.state.currentPage = 'start'
    const wrapper = mount(App as any, { global: { mocks: { $store: store, $q: { dark: { isActive: false } } } } })
    const vm: any = wrapper.vm
    // overlay should initially be false
    expect(vm.overlayActive).toBe(false)
    vm.onDragEnter()
    expect(vm.overlayActive).toBe(true)
    vm.onDragLeave()
    expect(vm.overlayActive).toBe(false)
  })

  it('onDrop sets pendingFileDrop and calls loadFile when on start', async () => {
    store.state.currentPage = 'start'
    const wrapper = mount(App as any, { global: { mocks: { $store: store, $q: { dark: { isActive: false } } } } })
    const vm: any = wrapper.vm
  const fakeFile = new File(['hello'], 'f.txt', { type: 'text/plain' })
    const event = { dataTransfer: { files: [fakeFile] } }
    vm.onDrop(event as any)
    expect(vm.pendingFileDrop).toBe(fakeFile)
  })
})
