import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import MenuBar from '../../src/components/toolbars/MenuBar.vue'

describe('MenuBar flows', () => {
  it('toggles dark mode and performs save/export anchor clicks', async () => {
    const darkToggle = vi.fn()
    // Mock $q.dialog to call onOk immediately
  const dialogMock = () => ({ onOk: (cb: (v: string) => void) => { cb('annotator') } })

    // Mock tokenManagers and annotationManager state
    const tokenBlock = { exportAsEntity: () => ({ a: 1 }) }
    const tokenManagers = [{ tokenBlocks: [tokenBlock] }]
    const annotationManager = { annotations: [{ entities: [] }], toJSON: () => [] , toRDF: () => '<rdf/>' }
    const labelManager = { toJSON: () => [] }

    // Spy on document.body.appendChild to capture created anchors and simulate click
    const clicks: string[] = []
    const originalAppend = document.body.appendChild
    const appendSpy = vi.fn((el: unknown) => {
      // append the actual element the component created so later removeChild succeeds
      const node = el as Node & { click?: () => void }
      // wrap native click to capture it
      const originalClick = node.click
      node.click = () => {
        clicks.push('a')
        if (typeof originalClick === 'function') originalClick.call(node)
      }
      // use the original append to avoid recursive replacement
      originalAppend.call(document.body, node)
      // trigger click
      node.click()
      return node
    })
    // @ts-expect-error - safe to assign in test environment
    document.body.appendChild = appendSpy

    const versionControlManager = { canUndo: true, canRedo: true, undo: () => {}, redo: () => {}, addUndo: () => {}, undoAll: () => {}, redoAll: () => {} }
    const wrapper = mount(MenuBar as unknown as Record<string, unknown>, {
      global: {
        mocks: {
          $store: { state: { currentPage: 'annotate', fileName: 'f', tokenManagers, annotationManager, labelManager, versionControlManager }, commit: () => {} },
          $q: { dark: { isActive: false, toggle: darkToggle }, dialog: dialogMock, notify: vi.fn() },
        },
        stubs: { 'about-dialog': true, 'open-dialog': true, 'exit-dialog': true },
      },
    })

    // toggle dark mode
  // call toggle via method
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(wrapper.vm as any).toggleDarkMode()
  expect(darkToggle).toHaveBeenCalled()

    // call save and export which should create and click anchors via our stub
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (wrapper.vm as any).save()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (wrapper.vm as any).export()

    // restore
  // restore
    document.body.appendChild = originalAppend
    expect(clicks.length).toBeGreaterThanOrEqual(2)
  })
})

