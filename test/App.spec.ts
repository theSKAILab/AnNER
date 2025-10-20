import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// Mock Quasar's useQuasar before importing the component so setup() picks it up
const notifyMock = vi.fn()
vi.mock('quasar', () => ({ useQuasar: () => ({ notify: notifyMock }) }))

import App from '../src/App.vue'

describe('App.vue drag/drop behavior', () => {
  it('toggles overlayActive on drag enter/leave and handles drop', async () => {
    const loadFile = vi.fn()
    const wrapper = mount(App as any, {
      global: {
        mocks: {
          $store: { state: { currentPage: 'start' }, commit: () => {}, dispatch: () => {}, loadFile },
          $q: { notify: vi.fn() },
        },
        stubs: ['menu-bar', 'start-page', 'annotation-page', 'review-page', 'exit-dialog'],
      },
    })

    // Initially overlay inactive
    expect((wrapper.vm as any).overlayActive).toBe(false)

    // Drag enter should set overlayActive when on start page
    await wrapper.trigger('dragenter')
    expect((wrapper.vm as any).overlayActive).toBe(true)

    // Drag leave should clear it
    await wrapper.trigger('dragleave')
    expect((wrapper.vm as any).overlayActive).toBe(false)

    // Simulate drop with a fake file
    const file = new File(['content'], 'test.txt', { type: 'text/plain' })
    const dataTransfer = { files: [file] }
    await wrapper.trigger('drop', { dataTransfer })
    // pendingFileDrop should be set to file
    expect((wrapper.vm as any).pendingFileDrop).toBe(file)
  })

  it('notify setup calls Quasar.notify with expected payload', () => {
    const loadFile = vi.fn()
    const wrapper = mount(App as any, {
      global: {
        mocks: {
          $store: { state: { currentPage: 'start' }, commit: () => {}, dispatch: () => {}, loadFile },
          $q: { notify: vi.fn() },
        },
        stubs: ['menu-bar', 'start-page', 'annotation-page', 'review-page', 'exit-dialog'],
      },
    })

    // call the notify wrapper returned by setup()
    ;(wrapper.vm as any).notify('i', 'hello', 'blue')

    expect(notifyMock).toHaveBeenCalled()
    expect(notifyMock).toHaveBeenCalledWith(expect.objectContaining({ icon: 'i', message: 'hello', color: 'blue' }))
  })

  it('drop when not on start page sets pendingFileDrop but does not call loadFile and shows exit-dialog', async () => {
    const loadFile = vi.fn()
    const wrapper = mount(App as any, {
      global: {
        mocks: {
          $store: { state: { currentPage: 'annotate' }, commit: () => {}, dispatch: () => {}, loadFile },
          $q: { notify: vi.fn() },
        },
        stubs: ['menu-bar', 'start-page', 'annotation-page', 'review-page', 'exit-dialog'],
      },
    })

    const file = new File(['content'], 'other.txt', { type: 'text/plain' })
    const dataTransfer = { files: [file] }
    await wrapper.trigger('drop', { dataTransfer })

    // loadFile should not have been called because currentPage != 'start'
    expect(loadFile).not.toHaveBeenCalled()

    // exit-dialog stub should receive show=true since pendingFileDrop != null and currentPage != 'start'
    const exitStub = wrapper.find('exit-dialog-stub')
    expect(exitStub.exists()).toBe(true)
    expect(exitStub.attributes('show')).toBe('true')
  })
})
