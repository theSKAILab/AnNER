import { mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import StartPage from '../../src/components/pages/StartPage.vue'
import LabelsBlock from '../../src/components/blocks/LabelsBlock.vue'
import { LabelManager } from '../../src/components/managers/LabelManager'

test('StartPage shows dark/bright logo based on $q.dark.isActive', () => {
  const wrapperDark = mount(StartPage, { global: { mocks: { $q: { dark: { isActive: true } } } } })
  expect(wrapperDark.html()).toContain('umaine-dark')
  const wrapperLight = mount(StartPage, { global: { mocks: { $q: { dark: { isActive: false } } } } })
  expect(wrapperLight.html()).toContain('umaine.png')
})

test('LabelsBlock saveLabel adds and duplicate path triggers notify and clear', async () => {
  const lm = new LabelManager([])
  const store = { state: { currentPage: 'annotate', labelManager: lm } }
  const mocks = { $q: { notify: vi.fn(), dialog: () => ({ onOk: () => {} }), dark: { isActive: false } }, $store: store }
  const wrapper = mount(LabelsBlock, { global: { mocks } })

  // call saveLabel when doesn't exist
  await wrapper.setData({ newClassName: 'test' })
  await (wrapper.vm as any).saveLabel()
  expect(lm.allLabels.length).toBe(1)

  // set duplicate name and call saveLabel to trigger notify
  await wrapper.setData({ newClassName: 'test' })
  await (wrapper.vm as any).saveLabel()
  expect(mocks.$q.notify).toHaveBeenCalled()
})
