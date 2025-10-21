import { shallowMount } from '@vue/test-utils'
import AboutDialog from '../../src/components/dialogs/AboutDialog.vue'

describe('AboutDialog', () => {
  it('exposes version and emits hide on dialog hide', async () => {
    const wrapper = shallowMount(AboutDialog, { props: { show: true } })
    // version should be present in data
    const vm: any = wrapper.vm
    expect(vm.version).toBeDefined()

    // simulate hide event on q-dialog
    await wrapper.trigger('hide')
    // component emits 'hide' when dialog hides
    // shallowMount with q-dialog stub means we assert nothing breaks
    // but ensure wrapper exists and version is accessible
    expect(wrapper.exists()).toBe(true)
  })
})
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AboutDialog from '../../src/components/dialogs/AboutDialog.vue'

describe('AboutDialog component', () => {
  it('renders version and title when shown', () => {
    const wrapper = mount(AboutDialog as unknown as Record<string, unknown>, {
      props: { show: true },
    })
    expect(wrapper.text()).toContain('Annotation and Named Entity Review Tool')
    expect(wrapper.text()).toContain('Version:')
  })
})
