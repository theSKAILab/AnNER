/* eslint-disable @typescript-eslint/no-explicit-any */
import { mount } from '@vue/test-utils'
import Shared from '../src/components/pages/shared.vue'
import { TMTokenBlock, TMTokenAggregate } from '../src/components/managers/TokenManager'
import { vi, describe, it, expect } from 'vitest'

describe('shared.vue remaining branches', () => {
  it('eligibleTokens adds TMTokenBlock when not overlapping', () => {
    // create a fake block instance (provide TMToken for tokens array)
    const t0: any = { start: 0, end: 1, text: 'a', currentState: 'Candidate', type: 'token' }
    const block = new TMTokenBlock(0, 2, [t0], { id: 'l1', name: 'L', color: '#000' }, 'Candidate')

    const tmStub: any = { tokens: [block], isOverlapping: vi.fn(() => null) }
    const store: any = { state: { tokenManager: tmStub, tokenManagers: [tmStub], currentIndex: 0, labelManager: { lastId: 1 }, currentPage: 'annotate', versionControlManager: { addUndo: vi.fn() } }, commit: vi.fn() }

    const wrapper = mount(Shared as any, { global: { mocks: { $store: store, $q: { dialog: vi.fn(), notify: vi.fn(), dark: { isActive: false } } } } })

    const list = (wrapper.vm as any).eligibleTokens
    expect(list.length).toBe(1)
    expect(list[0]).toBe(block)
  })

  it('eligibleTokens deduplicates overlapping aggregates', () => {
    // create two blocks that would produce the same aggregate
  const t1: any = { start: 0, end: 1, text: 'a', currentState: 'Candidate', type: 'token' }
  const t2: any = { start: 1, end: 2, text: 'b', currentState: 'Candidate', type: 'token' }
  const b1 = new TMTokenBlock(0, 2, [t1], { id: 'l1', name: 'L', color: '#000' }, 'Candidate')
  const b2 = new TMTokenBlock(1, 3, [t2], { id: 'l1', name: 'L', color: '#000' }, 'Candidate')

    // overlapping array returned for both calls - same serialized overlap
    const overlapping = [b1, b2]
    const tmStub: any = { tokens: [b1, b2], isOverlapping: vi.fn(() => overlapping) }
    const store: any = { state: { tokenManager: tmStub, tokenManagers: [tmStub], currentIndex: 0, labelManager: { lastId: 1 }, currentPage: 'annotate', versionControlManager: { addUndo: vi.fn() } }, commit: vi.fn() }

    const wrapper = mount(Shared as any, { global: { mocks: { $store: store, $q: { dialog: vi.fn(), notify: vi.fn(), dark: { isActive: false } } } } })

    const list = (wrapper.vm as any).eligibleTokens
    // Should produce a single aggregate, not duplicate
    expect(list.length).toBe(1)
    expect(list[0] instanceof TMTokenAggregate).toBe(true)
  })

  it('onRemoveBlock calls addUndo and removeBlock', () => {
    const removeSpy = vi.fn()
    const tmStub: any = { removeBlock: removeSpy }
    const vcm = { addUndo: vi.fn() }
    const store: any = { state: { tokenManager: tmStub, tokenManagers: [tmStub], currentIndex: 0, labelManager: { lastId: 1 }, currentPage: 'annotate', versionControlManager: vcm }, commit: vi.fn() }

    const wrapper = mount(Shared as any, { global: { mocks: { $store: store, $q: { dialog: vi.fn(), notify: vi.fn(), dark: { isActive: false } } } } })

    ;(wrapper.vm as any).onRemoveBlock(42)
    expect(vcm.addUndo).toHaveBeenCalledWith(tmStub)
    expect(removeSpy).toHaveBeenCalledWith(42)
  })

  it('beforeLeave returns warning string', () => {
    const wrapper = mount(Shared as any, { global: { mocks: { $store: { state: {} } } } })
    const res = (wrapper.vm as any).beforeLeave()
    expect(typeof res).toBe('string')
    expect(res.length).toBeGreaterThan(0)
  })
})
