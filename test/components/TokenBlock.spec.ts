/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TokenBlock from '../../src/components/blocks/TokenBlock.vue'

// Minimal mocks for store-mapped values
const label = { id: 1, name: 'TEST', color: 'red11' }
const token = {
  type: 'block',
  start: 0,
  tokens: [{ type: 'token', start: 0, text: 'hello' }],
  labelClass: label,
  currentState: 'Candidate',
  reviewed: false,
}

const versionControlManager = { addUndo: vi.fn() }
const tokenManager = { restoreOriginalBlockState: vi.fn() }
const labelManager = { currentLabel: label }

const mockStore = {
  state: {
    currentPage: 'review',
    versionControlManager: versionControlManager,
    tokenManager: tokenManager,
    labelManager: labelManager,
  },
}

describe('TokenBlock component', () => {
  it('cycles status and sets reviewed', async () => {
    const wrapper = mount(TokenBlock as unknown as Record<string, unknown>, {
      props: { token },
      global: {
        mocks: { $store: mockStore, $q: { dark: { isActive: false } }, versionControlManager: versionControlManager, tokenManager: tokenManager, labelManager: labelManager },
        stubs: { 'q-btn': true },
      },
    })
    // call methods directly
    // call the method on the component instance
  ;(wrapper.vm as any).cycleCurrentStatus()
    expect(token.reviewed).toBe(true)
  })

  it('changeLabel sets labelClass and marks reviewed', async () => {
    const localToken = { ...token, labelClass: { id: 2, name: 'OLD', color: 'blue11' } }
    const vcm = { addUndo: vi.fn() }
    const tm = { restoreOriginalBlockState: vi.fn() }
    const lm = { currentLabel: { id: 3, name: 'NEW', color: 'green11' } }

    const wrapper = mount(TokenBlock as any, {
      props: { token: localToken },
      global: { mocks: { $store: { state: { currentPage: 'review', versionControlManager: vcm, tokenManager: tm, labelManager: lm } }, versionControlManager: vcm, tokenManager: tm, labelManager: lm }, stubs: { 'q-btn': true } },
    })

    ;(wrapper.vm as any).changeLabel()
    expect(localToken.reviewed).toBe(true)
    expect(localToken.labelClass).toBe(lm.currentLabel)
  })

  it('removeBlock emits remove-block when not in review', async () => {
    const localToken = { ...token }
    const wrapper = mount(TokenBlock as any, {
      props: { token: localToken },
      global: { mocks: { $store: { state: { currentPage: 'annotate', versionControlManager: { addUndo: vi.fn() }, tokenManager: {} } } }, stubs: { 'q-btn': true } },
    })

    ;(wrapper.vm as any).removeBlock()
    // should have emitted remove-block
    expect(wrapper.emitted()['remove-block']).toBeTruthy()
  })

  it('toggleReviewed restores original state when reviewed true', async () => {
    const localToken = { ...token, reviewed: true }
    const tm = { restoreOriginalBlockState: vi.fn() }
    const wrapper = mount(TokenBlock as any, {
      props: { token: localToken },
      global: { mocks: { $store: { state: { currentPage: 'review', tokenManager: tm } }, tokenManager: tm }, stubs: { 'q-btn': true } },
    })

    ;(wrapper.vm as any).toggleReviewed()
    expect(tm.restoreOriginalBlockState).toHaveBeenCalledWith(localToken.start)
  })

  it('removeBlock calls addUndo and marks rejected when in review', async () => {
    const localToken = { ...token, currentState: 'Candidate', reviewed: false }
    const vcm = { addUndo: vi.fn() }
    const tm = { restoreOriginalBlockState: vi.fn() }

    const wrapper = mount(TokenBlock as any, {
      props: { token: localToken },
      global: {
        mocks: { $store: { state: { currentPage: 'review', versionControlManager: vcm, tokenManager: tm, labelManager: labelManager } }, versionControlManager: vcm, tokenManager: tm, labelManager: labelManager },
        stubs: { 'q-btn': true },
      },
    })

    ;(wrapper.vm as any).removeBlock()
    expect(vcm.addUndo).toHaveBeenCalled()
    expect(localToken.currentState).toBe('Rejected')
    expect(localToken.reviewed).toBe(true)
  })

  it('toggleReviewed sets reviewed when initially false', async () => {
    const localToken = { ...token, reviewed: false }
    const tm = { restoreOriginalBlockState: vi.fn() }
    const wrapper = mount(TokenBlock as any, {
      props: { token: localToken },
      global: { mocks: { $store: { state: { currentPage: 'review', tokenManager: tm } }, tokenManager: tm }, stubs: { 'q-btn': true } },
    })

    ;(wrapper.vm as any).toggleReviewed()
    expect(localToken.reviewed).toBe(true)
    expect(tm.restoreOriginalBlockState).not.toHaveBeenCalled()
  })
})

