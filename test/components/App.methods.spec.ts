import { describe, it, expect, vi } from 'vitest'
import App from '../../src/App.vue'

describe('App methods (direct)', () => {
  it('onDragEnter sets overlayActive only when on start page', () => {
    const ctx: any = { currentPage: 'start', overlayActive: false }
    ;(App.methods as any).onDragEnter.call(ctx)
    expect(ctx.overlayActive).toBe(true)

    const ctx2: any = { currentPage: 'annotate', overlayActive: false }
    ;(App.methods as any).onDragEnter.call(ctx2)
    expect(ctx2.overlayActive).toBe(false)
  })

  it('onDragLeave clears overlayActive only on start page', () => {
    const ctx: any = { currentPage: 'start', overlayActive: true }
    ;(App.methods as any).onDragLeave.call(ctx)
    expect(ctx.overlayActive).toBe(false)
  })

  it('onDrop sets pendingFileDrop and calls loadFile when on start', () => {
    const file = { name: 'f' }
    const ctx: any = { currentPage: 'start', overlayActive: true, pendingFileDrop: null, loadFile: vi.fn() }
    const ev: any = { dataTransfer: { files: [file] } }
    ;(App.methods as any).onDrop.call(ctx, ev)
    expect(ctx.pendingFileDrop).toBe(file)
    expect(ctx.loadFile).toHaveBeenCalledWith(file)
    expect(ctx.overlayActive).toBe(false)
  })
})
