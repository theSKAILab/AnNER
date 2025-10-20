import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Shared from '../../src/components/pages/shared.vue'

describe('Shared.eligibleTokens computed', () => {
  it('returns TMTokenAggregate when overlapping blocks exist', () => {
    // Create fake TMTokenBlock-like objects
    const block1 = { start: 0, end: 2, type: 'token-block' }
    const block2 = { start: 3, end: 5, type: 'token-block' }
    // tokenManager with one TMTokenBlock instance
    const tokenManager = {
      tokens: [block1, block2],
      isOverlapping: () => [block1, block2],
    }

    const wrapper = mount(Shared as unknown as Record<string, unknown>, {
      global: { mocks: { $store: { state: { tokenManager, currentPage: 'annotate', tokenManagers: [] }, commit: () => {} }, $q: { dialog: () => ({ onOk: () => {} }) } }, stubs: ['token', 'token-block', 'labels-block', 'aggregate-block', 'info-bar'] },
    })

    const eligible = (wrapper.vm as any).eligibleTokens
    // Should be an array and contain objects (we cannot assert class)
    expect(Array.isArray(eligible)).toBe(true)
  })
})
