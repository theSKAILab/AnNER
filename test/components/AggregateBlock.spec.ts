import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AggregateBlock from '../../src/components/blocks/AggregateBlock.vue'

describe('AggregateBlock component', () => {
  it('renders slot tokenblocks', () => {
    const passthrough = { template: '<div><slot /></div>' }
    const wrapper = mount(AggregateBlock as unknown as Record<string, unknown>, {
      props: { tokenBlocks: [{ type: 'block', start: 0 }] },
      global: {
        stubs: { TokenBlock: passthrough },
        mocks: {
          $store: {
            state: {
              tokenManager: {
                getBlockByStart: () => ({ start: 0, tokens: [], labelClass: { name: 'A', color: 'red11' }, currentState: 'Candidate', reviewed: false }),
              },
            },
          },
        },
      },
    })
    expect(wrapper.html()).toContain('aggregate-block')
  })
})
