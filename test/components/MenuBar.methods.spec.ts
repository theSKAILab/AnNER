import { describe, it, expect, vi } from 'vitest'
import MenuBar from '../../src/components/toolbars/MenuBar.vue'

describe('MenuBar methods (direct)', () => {
  it('toggleDarkMode calls $q.dark.toggle', () => {
    const ctx: any = {
      $q: { dark: { toggle: vi.fn() } },
    }
    ;(MenuBar.methods as any).toggleDarkMode.call(ctx)
    expect(ctx.$q.dark.toggle).toHaveBeenCalled()
  })

  it('menuKeyBind triggers refs and actions for various keys', () => {
    const ctx: any = {
      $refs: {
        fileMenu: { click: vi.fn() },
        editMenu: { click: vi.fn() },
        annotatorMenu: { click: vi.fn() },
        helpMenu: { click: vi.fn() },
        file: { click: vi.fn() },
      },
      $store: { state: { currentPage: 'annotate' } },
      setCurrentPage: vi.fn(),
      save: vi.fn(),
      export: vi.fn(),
      versionControlManager: {
        undo: vi.fn(),
        redo: vi.fn(),
        undoAll: vi.fn(),
        redoAll: vi.fn(),
      },
      tokenManager: {},
    }

    const mk = (key: string, ctrl = true, alt = false) => ({ key, ctrlKey: ctrl, altKey: alt, preventDefault: vi.fn() })

    // menu opens
    ;(MenuBar.methods as any).menuKeyBind.call(ctx, mk('f', true))
    expect(ctx.$refs.fileMenu.click).toHaveBeenCalled()

    ;(MenuBar.methods as any).menuKeyBind.call(ctx, mk('e', true))
    expect(ctx.$refs.editMenu.click).toHaveBeenCalled()

    ;(MenuBar.methods as any).menuKeyBind.call(ctx, mk('a', true))
    expect(ctx.$refs.annotatorMenu.click).toHaveBeenCalled()

    ;(MenuBar.methods as any).menuKeyBind.call(ctx, mk('h', true))
    expect(ctx.$refs.helpMenu.click).toHaveBeenCalled()

    // file actions
    ;(MenuBar.methods as any).menuKeyBind.call(ctx, mk('o', true))
    expect(ctx.$refs.file.click).toHaveBeenCalled()

    ;(MenuBar.methods as any).menuKeyBind.call(ctx, mk('s', true))
    // save calls mapped method
    // since ctx.save is a spy, expect it to have been called
    expect(ctx.save).toHaveBeenCalled()

    ;(MenuBar.methods as any).menuKeyBind.call(ctx, mk('d', true))
    expect(ctx.export).toHaveBeenCalled()

    // edit menu undo/redo branches
    ;(MenuBar.methods as any).menuKeyBind.call(ctx, mk('z', true))
    expect(ctx.versionControlManager.undo).toHaveBeenCalled()

    ;(MenuBar.methods as any).menuKeyBind.call(ctx, mk('y', true))
    expect(ctx.versionControlManager.redo).toHaveBeenCalled()

    // alt+z and alt+y
    ;(MenuBar.methods as any).menuKeyBind.call(ctx, mk('z', false, true))
    expect(ctx.versionControlManager.undoAll).toHaveBeenCalled()

    ;(MenuBar.methods as any).menuKeyBind.call(ctx, mk('y', false, true))
    expect(ctx.versionControlManager.redoAll).toHaveBeenCalled()
  })

  it('reloadWindow calls performReload', () => {
    const ctx: any = { performReload: vi.fn() }
    ;(MenuBar.methods as any).reloadWindow.call(ctx)
    expect(ctx.performReload).toHaveBeenCalled()
  })

  it('performReload calls window.location.reload (spied)', () => {
    const reload = vi.fn()
    const original = (window as any).location
    // replace location with a mock
    ;(window as any).location = { reload }
    ;(MenuBar.methods as any).performReload.call({})
    expect(reload).toHaveBeenCalled()
    // restore
    ;(window as any).location = original
  })
})
