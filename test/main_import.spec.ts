import { describe, it, expect, vi } from 'vitest'

// Mock createApp from 'vue' so importing main.ts doesn't mount a real app
const mockApp = { config: { globalProperties: {} }, use: vi.fn(() => mockApp), mount: vi.fn(() => {}) }
vi.mock('vue', () => ({ createApp: () => mockApp }))

// Mock mitt so main.ts gets a simple emitter
vi.mock('mitt', () => ({ default: () => ({ on: () => {}, off: () => {}, emit: () => {} }) }))

// Mock Quasar imports used in main.ts (two-argument form)
vi.mock('quasar', () => ({ Notify: {}, Dialog: {}, Quasar: {} }))
vi.mock('quasar/icon-set/fontawesome-v5.js', () => ({ default: {} }))

// Prevent importing actual styles
vi.mock('../src/styles/quasar.scss', () => ({}))

describe('main.ts import', () => {
  it('runs bootstrap without mounting a real app and sets emitter', async () => {
    // Import the file under test; mocks above will be used
    await import('../src/main.ts')
  // createApp mock should have been used and emitter assigned
  const gp = mockApp.config.globalProperties as unknown as { emitter?: { emit: () => void } }
  expect(gp.emitter).toBeDefined()
  expect(typeof gp.emitter!.emit).toBe('function')
  }, 20000)
})
