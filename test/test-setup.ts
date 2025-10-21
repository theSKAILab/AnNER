// Global test setup (copied from original tests) — provides Quasar/Vue Test Utils shims
import { config } from '@vue/test-utils'
import { vi } from 'vitest'

const emitter = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
}

config.global.mocks = {
  $q: {
    dark: { isActive: false, toggle: vi.fn() },
    dialog: vi.fn(() => Promise.resolve({})),
    notify: vi.fn(),
  },
}

const _globalMocks = config.global.mocks as Record<string, unknown>
_globalMocks['emitter'] = emitter

;(globalThis as unknown as { emitter?: typeof emitter }).emitter = emitter

const passthroughStub = { template: '<div><slot /></div>' }
config.global.stubs = {
  'q-btn': passthroughStub,
  'q-item-section': passthroughStub,
  'q-item': passthroughStub,
  'q-list': passthroughStub,
  'q-menu': passthroughStub,
  'q-icon': passthroughStub,
  'q-header': passthroughStub,
  'q-toolbar': passthroughStub,
  'q-dialog': passthroughStub,
  'q-card': passthroughStub,
  'q-card-section': passthroughStub,
  'q-card-actions': passthroughStub,
}

config.global.directives = {
  'close-popup': {},
}

;(globalThis as unknown as { __APP_VERSION__?: string }).__APP_VERSION__ = 'test'
