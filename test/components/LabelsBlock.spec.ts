import { shallowMount } from '@vue/test-utils'
import LabelsBlock from '../../src/components/blocks/LabelsBlock.vue'

describe('LabelsBlock', () => {
  it('saveLabel adds a new label when it does not exist and clears input', async () => {
    const labelManager = {
      allLabels: [],
      currentLabel: { id: 1, name: 'A', color: 'red-11' },
      addLabel: vi.fn(),
      doesAlreadyExist: vi.fn().mockReturnValue(false),
      deleteLabel: vi.fn(),
    }

    const wrapper = shallowMount(LabelsBlock, {
      global: {
        mocks: {
          $store: { state: { labelManager } },
          $q: { dark: { isActive: false }, notify: vi.fn(), dialog: vi.fn() },
        },
        stubs: ['q-chip', 'q-avatar', 'q-input', 'q-btn', 'q-card-section', 'q-space'],
      },
    })

    const vm: any = wrapper.vm
    vm.newClassName = 'newlabel'
    await vm.saveLabel()

    expect(labelManager.addLabel).toHaveBeenCalledWith('NEWLABEL')
    expect(vm.newClassName).toBe('')
  })

  it('saveLabel notifies on duplicate and clears input', async () => {
    const labelManager = {
      allLabels: [{ id: 1, name: 'A', color: 'red-11' }],
      currentLabel: { id: 1, name: 'A', color: 'red-11' },
      addLabel: vi.fn(),
      doesAlreadyExist: vi.fn().mockReturnValue(true),
      deleteLabel: vi.fn(),
    }
    const notify = vi.fn()

    const wrapper = shallowMount(LabelsBlock, {
      global: {
        mocks: { $store: { state: { labelManager } }, $q: { dark: { isActive: false }, notify, dialog: vi.fn() } },
        stubs: ['q-chip', 'q-avatar', 'q-input', 'q-btn', 'q-card-section', 'q-space'],
      },
    })

    const vm: any = wrapper.vm
    vm.newClassName = 'a'
    await vm.saveLabel()

    expect(notify).toHaveBeenCalled()
    expect(vm.newClassName).toBe('')
  })

  it('promptDelete calls labelManager.deleteLabel when dialog OK', async () => {
    const labelManager = {
      allLabels: [{ id: 1, name: 'A', color: 'red-11' }],
      currentLabel: { id: 1, name: 'A', color: 'red-11' },
      addLabel: vi.fn(),
      doesAlreadyExist: vi.fn(),
      deleteLabel: vi.fn(),
    }

    // mock dialog that calls onOk immediately
    const dialog = () => ({ onOk: (cb: Function) => cb() })

    const wrapper = shallowMount(LabelsBlock, {
      global: {
        mocks: { $store: { state: { labelManager } }, $q: { dark: { isActive: false }, dialog, notify: vi.fn() } },
        stubs: ['q-chip', 'q-avatar', 'q-input', 'q-btn', 'q-card-section', 'q-space'],
      },
    })

    const vm: any = wrapper.vm
    await vm.promptDelete('A')
    expect(labelManager.deleteLabel).toHaveBeenCalledWith('A')
  })
})
import { test, expect, vi, afterEach } from 'vitest'
import LabelsBlock from '../../src/components/blocks/LabelsBlock.vue'
import { shallowMount } from '@vue/test-utils'

afterEach(() => vi.restoreAllMocks())

test('saveLabel adds when new and notifies on duplicate', () => {
  const labelManager = {
    allLabels: [],
    currentLabel: { id: 0, name: 'A', color: 'red-11' },
    doesAlreadyExist: vi.fn().mockReturnValue(false),
    addLabel: vi.fn(),
    deleteLabel: vi.fn(),
  }
  const q = { dark: { isActive: false }, notify: vi.fn(), dialog: () => ({ onOk: (cb: any) => cb() }) }
  const store: any = { state: { currentPage: 'annotate' } }
  store.state.labelManager = labelManager
  const vm = shallowMount(LabelsBlock, { global: { mocks: { $store: store, $q: q }, provide: {} } })

  ;(vm.vm as any).newClassName = 'test'
  ;(vm.vm as any).saveLabel()
  expect(labelManager.addLabel).toHaveBeenCalled()

  // duplicate path
  labelManager.doesAlreadyExist = vi.fn().mockReturnValue(true)
  ;(vm.vm as any).newClassName = 'test'
  ;(vm.vm as any).saveLabel()
  expect(q.notify).toHaveBeenCalled()
})
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
