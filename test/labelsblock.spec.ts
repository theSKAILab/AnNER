/* eslint-disable @typescript-eslint/no-explicit-any */
import { mount } from '@vue/test-utils'
import LabelsBlock from '../src/components/blocks/LabelsBlock.vue'
import { LabelManager } from '../src/components/managers/LabelManager'
import { vi, describe, it, expect } from 'vitest'

describe('LabelsBlock.vue', () => {
  it('saveLabel adds a new label when it does not exist', async () => {
    const lm = new LabelManager()
    const store = { state: { labelManager: lm, currentPage: 'annotate' } }

    const wrapper = mount(LabelsBlock, {
      global: {
        mocks: {
          $store: store,
        },
      },
    })

    // Set the input and call save
    ;(wrapper.vm as any).newClassName = 'Test'
    await (wrapper.vm as any).saveLabel()

    expect(lm.allLabels.length).toBe(1)
    expect((wrapper.vm as any).newClassName).toBe('')
  })

  it('saveLabel notifies when label already exists', async () => {
    const lm = new LabelManager()
    lm.addLabel('TEST')
    const store = { state: { labelManager: lm, currentPage: 'annotate' } }

    const notify = vi.fn()

    const wrapper = mount(LabelsBlock, {
      global: {
        mocks: {
          $store: store,
          $q: { notify, dialog: vi.fn(), dark: { isActive: false, toggle: vi.fn() } },
        },
      },
    })

    ;(wrapper.vm as any).newClassName = 'test'
    await (wrapper.vm as any).saveLabel()

    expect(notify).toHaveBeenCalled()
    expect(lm.allLabels.length).toBe(1)
    expect((wrapper.vm as any).newClassName).toBe('')
  })

  it('promptDelete calls labelManager.deleteLabel when dialog onOk invoked', async () => {
    const lm = new LabelManager()
    lm.addLabel('DELME')
    const store = { state: { labelManager: lm, currentPage: 'annotate' } }

  const dialogMock = vi.fn(() => ({ onOk: (cb: () => void) => { cb(); return { onOk: () => {} } } }))

    const wrapper = mount(LabelsBlock, {
      global: {
        mocks: {
          $store: store,
          $q: { dialog: dialogMock, notify: vi.fn(), dark: { isActive: false, toggle: vi.fn() } },
        },
      },
    })

    // Call promptDelete and ensure the label is removed
    await (wrapper.vm as any).promptDelete('DELME')

    expect(dialogMock).toHaveBeenCalled()
    expect(lm.allLabels.find(l => l.name === 'DELME')).toBeUndefined()
  })
})
