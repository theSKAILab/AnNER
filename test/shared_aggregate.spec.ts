import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Shared from '../src/components/pages/shared.vue'
import { LabelManager } from '../src/components/managers/LabelManager'
import { TokenManager, TMTokenBlock, TMToken } from '../src/components/managers/TokenManager'

describe('shared.vue eligibleTokens aggregate branch', () => {
  it('returns TMTokenAggregate when overlapping blocks present', () => {
    const lm = new LabelManager()
    lm.addLabel('A')
    const tm = new TokenManager(lm, [])
    const b1 = new TMTokenBlock(0,2,[new TMToken(0,1,'a','Candidate')], lm.currentLabel as any, 'Candidate')
    const b2 = new TMTokenBlock(1,3,[new TMToken(1,2,'b','Candidate')], lm.currentLabel as any, 'Candidate')
    tm.tokens = [b1, b2]

    const store: any = { state: { tokenManager: tm, tokenManagers: [tm], currentIndex: 0, labelManager: lm, versionControlManager: { addUndo: () => {} }, currentPage: 'annotate' }, commit: () => {} }
    const wrapper = mount(Shared as any, { global: { mocks: { $store: store, $q: { dialog: () => ({ onOk: () => {} }), notify: () => {}, dark: { isActive: false } } } } })
    const eligible = (wrapper.vm as any).eligibleTokens
    // should include an aggregate
    expect(eligible.some((t: any) => t.type === 'token-aggregate')).toBe(true)
  })
})
