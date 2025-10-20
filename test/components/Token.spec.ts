import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Token from '../../src/components/blocks/Token.vue'

describe('Token component', () => {
  it('renders token text', () => {
    const wrapper = mount(Token as unknown as Record<string, unknown>, { props: { token: { type: 'token', start: 1, text: 'a' } } })
    expect(wrapper.text()).toContain('a')
  })
})
