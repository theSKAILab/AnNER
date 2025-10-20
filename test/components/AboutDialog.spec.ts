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
