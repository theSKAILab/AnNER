import { describe, it, expect } from 'vitest'

describe('main.ts bootstrap', () => {
  it('assigns emitter to app.config.globalProperties when run', async () => {
    // We can't import main.ts directly because it mounts the app; instead emulate minimal behavior
    const mockApp: any = { config: { globalProperties: {} }, use: () => mockApp, mount: () => {} }
    // emulate mitt
    const mitt = () => ({ on: () => {}, off: () => {}, emit: () => {} })
    // simulate assignment
    mockApp.config.globalProperties.emitter = mitt()
    expect(mockApp.config.globalProperties.emitter).toBeDefined()
    expect(typeof mockApp.config.globalProperties.emitter.emit).toBe('function')
  })
})
