/* eslint-disable @typescript-eslint/no-explicit-any */
import { mount } from '@vue/test-utils'
import Shared from '../src/components/pages/shared.vue'
import { LabelManager } from '../src/components/managers/LabelManager'
import { TokenManager } from '../src/components/managers/TokenManager'
import { vi, describe, it, expect } from 'vitest'

describe('shared.vue additional branches', () => {
  it('selectTokens non-overlapping calls addUndo and addNewBlock (Suggested on review page)', async () => {
    const lm = new LabelManager()
    lm.addLabel('X')

    const tmStub: any = { isOverlapping: vi.fn(() => null), addNewBlock: vi.fn() }
    const vcm = { addUndo: vi.fn() }

    const sel = {
      anchorOffset: 0,
      focusOffset: 1,
      anchorNode: {},
      focusNode: {},
      getRangeAt: () => ({ startContainer: { parentElement: { id: 't1' } }, startOffset: 0, endContainer: { parentElement: { id: 't2' } }, endOffset: 0 }),
      rangeCount: 1,
      empty: vi.fn(),
    }
    ;(document as any).getSelection = () => sel as unknown as Selection

    const store: any = { state: { tokenManager: tmStub, tokenManagers: [tmStub], currentIndex: 0, labelManager: lm, currentPage: 'review', versionControlManager: vcm }, commit: vi.fn() }

    const wrapper = mount(Shared as any, {
      global: { mocks: { $store: store, $q: { dialog: vi.fn(() => ({ onOk() {} })), notify: vi.fn(), dark: { isActive: false } } } },
    })

    const e = { detail: 1 } as unknown as MouseEvent
    await (wrapper.vm as any).selectTokens(e)

    expect(vcm.addUndo).toHaveBeenCalledWith(tmStub)
    expect(tmStub.addNewBlock).toHaveBeenCalled()
    expect(sel.empty).toHaveBeenCalled()
  })

  it('tokenizeCurrentSentence / tmEdited watch handler executes mapped mutation', () => {
    const lm = new LabelManager()
    const tm = new TokenManager(lm, [[0,1,'a']])

    const store: any = { state: { tokenManager: tm, tokenManagers: [tm], currentIndex: 0, labelManager: lm, currentPage: 'annotate', versionControlManager: { addUndo: vi.fn() } }, commit: vi.fn() }

    const wrapper = mount(Shared as any, {
      global: { mocks: { $store: store, $q: { dialog: vi.fn(), notify: vi.fn(), dark: { isActive: false } } } },
    })

    // Call the watch handler directly to exercise the watch branch
    ;(wrapper.vm as any).$options.watch.tmEdited.handler.call(wrapper.vm)

    // The mapped mutation should call store.commit internally
    expect(store.commit).toHaveBeenCalled()
  })

  it('selectTokens returns early when range parsing throws', async () => {
    const lm = new LabelManager()
    const tokens = [[0,1,'a'],[1,2,'b']] as any
    const tm = new TokenManager(lm, tokens)

    const store: any = { state: { tokenManager: tm, tokenManagers: [tm], currentIndex: 0, labelManager: lm, currentPage: 'annotate', versionControlManager: { addUndo: vi.fn() } }, commit: vi.fn() }

    // Make getRangeAt return an object with null parentElement to force parse failure
    const sel = {
      anchorOffset: 0,
      focusOffset: 1,
      anchorNode: {},
      focusNode: {},
      getRangeAt: () => ({ startContainer: { parentElement: null }, startOffset: 0, endContainer: { parentElement: null }, endOffset: 0 }),
      rangeCount: 1,
      empty: vi.fn(),
    }
    ;(document as any).getSelection = () => sel as unknown as Selection

    const wrapper = mount(Shared as any, {
      global: { mocks: { $store: store, $q: { dialog: vi.fn(), notify: vi.fn(), dark: { isActive: false } } } },
    })

    const e = { detail: 1 } as unknown as MouseEvent
    await (wrapper.vm as any).selectTokens(e)

    // No blocks should be added
    expect(tm.tokens.length).toBe(2)
  })
})
