import { describe, it, expect, vi } from 'vitest'
import MenuBar from '../../src/components/toolbars/MenuBar.vue'

describe('MenuBar save/export', () => {
  it('save builds download link and clicks it on dialog onOk', () => {
    const clickSpy = vi.fn()
    // mock document.createElement to return a real element but with click spied
    const originalCreate = document.createElement
    document.createElement = ((tag: string) => {
      // call originalCreate with document as its thisArg to avoid invalid receiver errors in jsdom
      const el = (originalCreate as any).call(document, tag)
      el.click = clickSpy
      return el
    }) as any

    const tokenBlock = { exportAsEntity: () => ({ id: 1 }) }
    const tokenManagers = [{ tokenBlocks: [tokenBlock] }]
    const annotationManager = { annotations: [{ entities: [] }], toJSON: vi.fn().mockReturnValue({}) }
    const labelManager = { toJSON: vi.fn().mockReturnValue({}) }

    const ctx: any = {
      $q: { dialog: () => ({ onOk: (cb: any) => cb('me') }) },
      tokenManagers,
      annotationManager,
      labelManager,
    }

    try {
      ;(MenuBar.methods as any).save.call(ctx)
      expect(clickSpy).toHaveBeenCalled()
    } finally {
      // restore original createElement even if the test fails
      document.createElement = originalCreate
    }
  })

  it('export builds download link and clicks it on dialog onOk', () => {
    const clickSpy = vi.fn()
    const originalCreate = document.createElement
    document.createElement = ((tag: string) => {
      const el = (originalCreate as any).call(document, tag)
      el.click = clickSpy
      return el
    }) as any

    const tokenBlock = { exportAsEntity: () => ({ id: 1 }) }
    const tokenManagers = [{ tokenBlocks: [tokenBlock] }]
    const annotationManager = { annotations: [{ entities: [] }], toRDF: vi.fn().mockReturnValue('<rdf></rdf>') }
    const labelManager = { toJSON: vi.fn().mockReturnValue({}) }

    const ctx: any = {
      $q: { dialog: () => ({ onOk: (cb: any) => cb('file') }) },
      tokenManagers,
      annotationManager,
      labelManager,
    }

    try {
      ;(MenuBar.methods as any).export.call(ctx)
      expect(clickSpy).toHaveBeenCalled()
    } finally {
      document.createElement = originalCreate
    }
  })
})
