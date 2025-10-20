// Global test setup: provide richer Quasar and globalProperties stubs used by components
import { config } from '@vue/test-utils'
import { vi } from 'vitest'

// A simple emitter shim (like mitt) so components that access app.config.globalProperties.emitter won't crash
const emitter = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
}

// Provide default mocks for Quasar's $q used across components: dark mode, dialog, and notify
config.global.mocks = {
  $q: {
    dark: { isActive: false, toggle: vi.fn() },
    // dialog commonly returns a promise; provide a mock that resolves immediately
    dialog: vi.fn(() => Promise.resolve({})),
    notify: vi.fn(),
  },
}

// Make emitter available on the default globalProperties so components accessing
// `appContext.config.globalProperties.emitter` during mounting find it.
// Vue Test Utils will pick this up when mounting components unless overridden per-test.
// Expose emitter via the test-utils mocks so mounting picks it up as a global property
const _globalMocks = config.global.mocks as Record<string, unknown>
_globalMocks['emitter'] = emitter

// Also attach to globalThis for any direct access paths used in older tests
;(globalThis as unknown as { emitter?: typeof emitter }).emitter = emitter

// Stub common Quasar components so tests don't need the full Quasar library.
// Make stubs render their default slot so inner text and children are preserved
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
  // Additional dialog/card components
  'q-dialog': passthroughStub,
  'q-card': passthroughStub,
  'q-card-section': passthroughStub,
  'q-card-actions': passthroughStub,
}

// Stub Quasar directives used in templates
config.global.directives = {
  'close-popup': {},
}

// Provide a test app version constant used by AboutDialog.vue
;(globalThis as unknown as { __APP_VERSION__?: string }).__APP_VERSION__ = 'test'
