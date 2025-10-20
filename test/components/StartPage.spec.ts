import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StartPage from '../../src/components/pages/StartPage.vue'

describe('StartPage component', () => {
  it('renders hints and buttons', () => {
    const wrapper = mount(StartPage as unknown as Record<string, unknown>, { global: { mocks: { $q: { dark: { isActive: false } } }, stubs: { 'q-file': true, 'q-btn': true, 'q-icon': true } } })
    expect(wrapper.text()).toContain('Hint:')
  })
})
