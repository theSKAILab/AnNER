/* eslint-disable @typescript-eslint/no-explicit-any */
import { mount } from '@vue/test-utils'
import Shared from '../src/components/pages/shared.vue'
import { LabelManager } from '../src/components/managers/LabelManager'
import { vi, describe, it, expect } from 'vitest'

describe('shared.vue extra branches', () => {
  it('selectTokens returns early on double click (e.detail>1)', async () => {
    const lm = new LabelManager()
    const tmStub: any = { tokens: [], isOverlapping: vi.fn(() => null), addNewBlock: vi.fn() }
    const store: any = { state: { tokenManager: tmStub, tokenManagers: [tmStub], currentIndex: 0, labelManager: lm, currentPage: 'annotate', versionControlManager: { addUndo: vi.fn() } }, commit: vi.fn() }

    const wrapper = mount(Shared as any, { global: { mocks: { $store: store, $q: { dialog: vi.fn(), notify: vi.fn(), dark: { isActive: false } } } } })

    const sel = { anchorOffset: 0, focusOffset: 1, anchorNode: {}, focusNode: {}, getRangeAt: () => ({ startContainer: { parentElement: { id: 't0' } }, startOffset: 0, endContainer: { parentElement: { id: 't1' } }, endOffset: 0 }), rangeCount: 1, empty: vi.fn() }
    ;(document as any).getSelection = () => sel as unknown as Selection

    const e = { detail: 2 } as unknown as MouseEvent
    await (wrapper.vm as any).selectTokens(e)

    // Should not have attempted to add a block
    expect(store.state.versionControlManager.addUndo).not.toHaveBeenCalled()
  })

  it('selectTokens overlapping dialog cancel path does not call addUndo or addNewBlock', async () => {
    const lm = new LabelManager()
    lm.addLabel('X')
    const tmStub: any = { isOverlapping: vi.fn(() => [{ start: 0, end: 1 }]), addNewBlock: vi.fn() }
    const vcm = { addUndo: vi.fn() }

    const sel = { anchorOffset: 0, focusOffset: 1, anchorNode: {}, focusNode: {}, getRangeAt: () => ({ startContainer: { parentElement: { id: 't0' } }, startOffset: 0, endContainer: { parentElement: { id: 't1' } }, endOffset: 0 }), rangeCount: 1, empty: vi.fn() }
    ;(document as any).getSelection = () => sel as unknown as Selection

    // dialog mock that returns an object without calling onOk (simulate cancel)
    const dialogMock = vi.fn(() => ({ onOk() { /* no call */ } }))

    const store: any = { state: { tokenManager: tmStub, tokenManagers: [tmStub], currentIndex: 0, labelManager: lm, currentPage: 'annotate', versionControlManager: vcm }, commit: vi.fn() }

    const wrapper = mount(Shared as any, { global: { mocks: { $store: store, $q: { dialog: dialogMock, notify: vi.fn(), dark: { isActive: false } } } } })

    const e = { detail: 1 } as unknown as MouseEvent
    await (wrapper.vm as any).selectTokens(e)

    expect(vcm.addUndo).not.toHaveBeenCalled()
    expect(tmStub.addNewBlock).not.toHaveBeenCalled()
  })

  it('tokenizeCurrentSentence calls the mapped mutation setTokenManager via commit', () => {
    const lm = new LabelManager()
    const tm = { tokens: [] }
    const store: any = { state: { tokenManagers: [tm], currentIndex: 0 }, commit: vi.fn() }
    const wrapper = mount(Shared as any, { global: { mocks: { $store: store, $q: { dialog: vi.fn(), notify: vi.fn(), dark: { isActive: false } } } } })

    ;(wrapper.vm as any).tokenizeCurrentSentence()

    expect(store.commit).toHaveBeenCalled()
  })
})
