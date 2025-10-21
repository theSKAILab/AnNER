import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import LabelsBlock from '../../src/components/blocks/LabelsBlock.vue'
import { LabelManager } from '../../src/components/managers/LabelManager'

describe('LabelsBlock branches', () => {
  it('saveLabel adds when new and notifies on duplicate', async () => {
    const lm = new LabelManager()
    const store: any = { state: { labelManager: lm, currentPage: 'annotate' } }
    const notify = vi.fn()
    const wrapper = mount(LabelsBlock as any, { global: { mocks: { $store: store, $q: { notify, dark: { isActive: false }, dialog: vi.fn() } } } })

    // add new label
    await wrapper.setData({ newClassName: 'foo' })
    ;(wrapper.vm as any).saveLabel()
    expect(lm.doesAlreadyExist('FOO')).toBe(true)

    // attempt duplicate
    await wrapper.setData({ newClassName: 'foo' })
    ;(wrapper.vm as any).saveLabel()
    expect(notify).toHaveBeenCalled()
  })

  it('promptDelete calls deleteLabel on confirm', () => {
    const lm = new LabelManager()
    lm.addLabel('A')
    const store: any = { state: { labelManager: lm, currentPage: 'annotate' } }
    // mock dialog to immediately call onOk
    const dialog = vi.fn(() => ({ onOk: (cb: any) => cb() }))
    const wrapper = mount(LabelsBlock as any, { global: { mocks: { $store: store, $q: { dialog, dark: { isActive: false } } } } })
    ;(wrapper.vm as any).promptDelete('A')
    expect(lm.getLabelByName('A')).toBeUndefined()
  })
})
