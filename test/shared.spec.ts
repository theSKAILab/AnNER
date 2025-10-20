/* eslint-disable @typescript-eslint/no-explicit-any */
import { mount } from '@vue/test-utils'
import Shared from '../src/components/pages/shared.vue'
import { LabelManager } from '../src/components/managers/LabelManager'
import { TokenManager, TMToken } from '../src/components/managers/TokenManager'
import { vi, describe, it, expect, beforeEach } from 'vitest'

describe('shared.vue', () => {
  let lm: LabelManager
  let tm: TokenManager

  beforeEach(() => {
    lm = new LabelManager()
    // create simple tokens: [t0..t3]
    const tokens = [
      [0, 1, 'a'],
      [1, 2, 'b'],
      [2, 3, 'c'],
      [3, 4, 'd'],
    ] as any
    tm = new TokenManager(lm, tokens)
  })

  it('eligibleTokens returns TMToken instances for simple tokens', () => {
    const store: any = {
      state: { tokenManager: tm, tokenManagers: [tm], currentIndex: 0, labelManager: lm, currentPage: 'annotate', versionControlManager: { addUndo: vi.fn() } },
      commit: vi.fn(),
    }

    const wrapper = mount(Shared as any, {
      global: { mocks: { $store: store, $q: { dialog: vi.fn(), notify: vi.fn(), dark: { isActive: false } } } },
    })

    const list = (wrapper.vm as any).eligibleTokens
    expect(Array.isArray(list)).toBe(true)
    // Should be TMToken instances (not aggregates) since no blocks
    expect(list.length).toBe(4)
    expect(list[0] instanceof TMToken).toBe(true)
  })

  it('selectTokens early returns when selection is collapsed or invalid', async () => {
    const store: any = { state: { tokenManager: tm, tokenManagers: [tm], currentIndex: 0, labelManager: lm, currentPage: 'annotate', versionControlManager: { addUndo: vi.fn() } } }

    const wrapper = mount(Shared as any, {
      global: { mocks: { $store: store, $q: { dialog: vi.fn(), notify: vi.fn(), dark: { isActive: false } } } },
    })

    // Mock selection to simulate collapsed selection
    const node = {}
    const sel = {
      anchorOffset: 0,
      focusOffset: 0,
      anchorNode: node,
      focusNode: node,
      getRangeAt: () => { throw new Error('no range') },
      rangeCount: 0,
      empty: vi.fn(),
    }
  ;(document as any).getSelection = () => sel as unknown as Selection

    // Create a fake event
    const e = { detail: 1 } as unknown as MouseEvent
    await (wrapper.vm as any).selectTokens(e)

    // No changes should be applied; tokens length unchanged
    expect(tm.tokens.length).toBe(4)
  })

  it('selectTokens shows dialog and empties selection when no labels available', async () => {
    const lmNo = new LabelManager()
    // labelManager.lastId === 0 triggers no-tags dialog
    const sel = {
      anchorOffset: 0,
      focusOffset: 1,
      anchorNode: {},
      focusNode: {},
  getRangeAt: () => ({ startContainer: { parentElement: { id: 't0' } }, startOffset: 0, endContainer: { parentElement: { id: 't1' } }, endOffset: 0 }),
      rangeCount: 1,
      empty: vi.fn(),
    }
  ;(document as any).getSelection = () => sel as unknown as Selection

    const dialogMock = vi.fn()

    const store: any = { state: { tokenManager: tm, tokenManagers: [tm], currentIndex: 0, labelManager: lmNo, currentPage: 'annotate', versionControlManager: { addUndo: vi.fn() } } }

    const wrapper = mount(Shared as any, {
      global: { mocks: { $store: store, $q: { dialog: dialogMock, notify: vi.fn(), dark: { isActive: false } } } },
    })

    const e = { detail: 1 } as unknown as MouseEvent
    await (wrapper.vm as any).selectTokens(e)

    expect(dialogMock).toHaveBeenCalled()
    expect(sel.empty).toHaveBeenCalled()
  })

  it('selectTokens handles overlapping branch and calls addUndo and addNewBlock onOk', async () => {
    // prepare label manager with a label
    const lmYes = new LabelManager()
    lmYes.addLabel('X')

    // stub tokenManager.isOverlapping to return an array and spy on addNewBlock
    const tmStub: any = { isOverlapping: vi.fn(() => [{ start: 0, end: 1 }]), addNewBlock: vi.fn() }
    const vcm = { addUndo: vi.fn() }

    const sel = {
      anchorOffset: 0,
      focusOffset: 1,
      anchorNode: {},
      focusNode: {},
  getRangeAt: () => ({ startContainer: { parentElement: { id: 't0' } }, startOffset: 0, endContainer: { parentElement: { id: 't1' } }, endOffset: 0 }),
      rangeCount: 1,
      empty: vi.fn(),
    }
  ;(document as any).getSelection = () => sel as unknown as Selection

    const dialogMock = vi.fn(() => {
      return {
        onOk(cb: any) {
          cb()
          return { onOk() {} }
        },
      }
    })

    const store: any = { state: { tokenManager: tmStub, tokenManagers: [tmStub], currentIndex: 0, labelManager: lmYes, currentPage: 'annotate', versionControlManager: vcm } }

    const wrapper = mount(Shared as any, {
      global: { mocks: { $store: store, $q: { dialog: dialogMock, notify: vi.fn(), dark: { isActive: false } } } },
    })

    const e = { detail: 1 } as unknown as MouseEvent
    await (wrapper.vm as any).selectTokens(e)

    expect(dialogMock).toHaveBeenCalled()
    expect(vcm.addUndo).toHaveBeenCalledWith(tmStub)
    expect(tmStub.addNewBlock).toHaveBeenCalled()
  })
})
