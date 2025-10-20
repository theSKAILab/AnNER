import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import OpenDialog from '../../src/components/dialogs/OpenDialog.vue'
import ExitDialog from '../../src/components/dialogs/ExitDialog.vue'

describe('Open/Exit Dialogs', () => {
  it('OpenDialog shows confirmation text and emits confirm', async () => {
    const wrapper = mount(OpenDialog as unknown as Record<string, unknown>, { props: { show: true } })
    expect(wrapper.text()).toContain('Are you sure you want to open a new file?')
    await wrapper.findAll('q-btn').at(1)?.trigger('click')
  })

  it('ExitDialog shows confirmation text and emits confirm', async () => {
    const wrapper = mount(ExitDialog as unknown as Record<string, unknown>, { props: { show: true } })
    expect(wrapper.text()).toContain('Are you sure you want to close this file?')
    await wrapper.findAll('q-btn').at(1)?.trigger('click')
  })
})
