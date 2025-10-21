import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LabelsBlock from '../../src/components/blocks/LabelsBlock.vue'
import { LabelManager } from '../../src/components/managers/LabelManager'

describe('LabelsBlock avatar branches', () => {
  it('renders selected and unselected avatars when multiple labels exist', () => {
    const lm = new LabelManager()
    lm.addLabel('A')
    lm.addLabel('B')
    // currentLabel defaults to first label
    const store: any = { state: { labelManager: lm, currentPage: 'annotate' } }
    const wrapper = mount(LabelsBlock as any, { global: { mocks: { $store: store, $q: { dark: { isActive: false } } } } })
    const html = wrapper.html()
    // both labels' names should be present
    expect(html).toContain('A')
    expect(html).toContain('B')
    // the selected label should include check icon text
    expect(html).toContain('fa fa-check')
  })
})
