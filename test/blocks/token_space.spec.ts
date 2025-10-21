import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Token from '../../src/components/blocks/Token.vue'

describe('Token rendering branches', () => {
  it('renders non-breaking space for token text equal to single space', () => {
    const token = { type: 'token', start: 1, end: 2, text: ' ' }
    const wrapper = mount(Token as any, { props: { token } })
    // Text should contain the literal '&nbsp;'
    expect(wrapper.html()).toContain('&nbsp;')
  })
})
