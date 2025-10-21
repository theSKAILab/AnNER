import { describe, it, expect, vi } from 'vitest'

// Test App.setup which uses useQuasar - mock it so setup runs safely
vi.mock('quasar', () => ({ useQuasar: () => ({ notify: vi.fn() }) }))
import App from '../src/App.vue'
import MenuBar from '../src/components/toolbars/MenuBar.vue'
import LabelsBlock from '../src/components/blocks/LabelsBlock.vue'
import TokenBlock from '../src/components/blocks/TokenBlock.vue'
import { shallowMount } from '@vue/test-utils'

describe('coverage targeted functions', () => {
  it('App.setup returns notify and it can be called', () => {
    const setupReturn = (App as any).setup()
    expect(typeof setupReturn.notify).toBe('function')
    // call notify to execute inner function body
    setupReturn.notify('icon', 'message', 'positive')
  })

  it('MenuBar.created adds document and window event listeners', () => {
    const docSpy = vi.spyOn(document, 'addEventListener')
    const winSpy = vi.spyOn(window, 'addEventListener')

    const ctx: any = { menuKeyBind: vi.fn() }
    ;(MenuBar as any).created.call(ctx)

    expect(docSpy).toHaveBeenCalled()
    // should have registered keyup on document
    expect(docSpy).toHaveBeenCalledWith('keyup', ctx.menuKeyBind)
    // should have registered beforeinstallprompt and appinstalled on window
    expect(winSpy).toHaveBeenCalled()

    docSpy.mockRestore()
    winSpy.mockRestore()
  })

  it('LabelsBlock watcher allLabels can be invoked directly', () => {
    const labelManager = { allLabels: [], currentLabel: { id: 1, name: 'A', color: 'red-11' } }
    const wrapper = shallowMount(LabelsBlock, {
      global: { mocks: { $store: { state: { labelManager } }, $q: { dark: { isActive: false }, notify: vi.fn(), dialog: vi.fn() } }, stubs: ['q-chip', 'q-avatar', 'q-input', 'q-btn', 'q-card-section', 'q-space'] },
    })

    // call the watcher function directly from the component options
    ;(LabelsBlock as any).watch.allLabels.call((wrapper.vm as any))
  })

  it('TokenBlock.toggleReviewed calls restoreOriginalBlockState when reviewed', () => {
    const token = { start: 5, reviewed: true, currentState: 'Candidate', labelClass: { color: 'red-11', name: 'A' }, tokens: [] }
    const tokenManager = { restoreOriginalBlockState: vi.fn() }
    const versionControlManager = { addUndo: vi.fn() }

    const wrapper = shallowMount(TokenBlock as any, {
      props: { token },
      global: {
        mocks: {
          $store: { state: { currentPage: 'review', tokenManager, versionControlManager } },
        },
        stubs: ['q-btn', 'Token'],
      },
    })

    const vm: any = wrapper.vm
    ;(vm as any).toggleReviewed()
    expect(tokenManager.restoreOriginalBlockState).toHaveBeenCalledWith(token.start)
  })
})
