import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Shared from '../../src/components/pages/shared.vue'

describe('Shared.selectTokens behavior', () => {
  it('returns early if no selection', () => {
    const wrapper = mount(Shared as unknown as Record<string, unknown>, { global: { mocks: { $store: { state: { labelManager: { lastId: false }, tokenManagers: [] }, commit: () => {} }, $q: { dialog: vi.fn() } } } })
    // simulate event with detail=1 and no selection
    const fn = (wrapper.vm as unknown as { selectTokens: (e: MouseEvent) => unknown }).selectTokens
    const res = fn({ detail: 1 } as MouseEvent)
    expect(res).toBeUndefined()
  })

  it('shows dialog when no labels available', () => {
    const dialog = vi.fn(() => ({ onOk: () => {} }))
    const wrapper = mount(Shared as unknown as Record<string, unknown>, { global: { mocks: { $store: { state: { labelManager: { lastId: 0 }, tokenManagers: [] }, commit: () => {} }, $q: { dialog } } } })
    const fn = (wrapper.vm as any).selectTokens
    // create a selection-like object on document
  const selectionMock: unknown = { anchorOffset: 1, focusOffset: 2, anchorNode: {}, focusNode: {}, getRangeAt: () => ({ startContainer: { parentElement: { id: 't1' } }, endContainer: { parentElement: { id: 't2' }, endOffset: 2 }, rangeCount: 1 }), rangeCount: 1, empty: () => {} }
  // provide fake selection for test
  // @ts-expect-error override DOM API in test
  document.getSelection = () => selectionMock
  fn({ detail: 1 } as MouseEvent)
    expect(dialog).toHaveBeenCalled()
  })

  it('handles overlapping branch when tokenManager.isOverlapping returns array', () => {
  const dialog = vi.fn(() => ({ onOk: (cb: () => void) => cb() }))
  const isOverlapping = vi.fn(() => [{ start: 0, end: 1 }])
  const addNewBlock = vi.fn()
  const tokenManager = { isOverlapping, addNewBlock }
  const versionControlManager = { addUndo: vi.fn() }
  const wrapper = mount(Shared as unknown as Record<string, unknown>, { global: { mocks: { $store: { state: { labelManager: { lastId: 1, currentLabel: {} }, tokenManagers: [tokenManager], tokenManager, versionControlManager }, commit: () => {} }, $q: { dialog } }, stubs: { 'q-dialog': true } } })
    const selectionMock = { anchorOffset: 1, focusOffset: 2, anchorNode: {}, focusNode: {}, getRangeAt: () => ({ startContainer: { parentElement: { id: 't1' } }, endContainer: { parentElement: { id: 't2' }, endOffset: 2 }, rangeCount: 1 }), rangeCount: 1, empty: () => {} }
  // provide fake selection for test
  // @ts-expect-error override DOM API in test
  document.getSelection = () => selectionMock
  const fn = (wrapper.vm as unknown as { selectTokens: (e: MouseEvent) => unknown }).selectTokens
  fn({ detail: 1 } as MouseEvent)
  expect(isOverlapping).toHaveBeenCalled()
  expect(versionControlManager.addUndo).toHaveBeenCalled()
  })
})
