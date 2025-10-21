import { test, expect, vi, afterEach } from 'vitest'
import InfoBar from '../../src/components/toolbars/InfoBar.vue'
import { shallowMount } from '@vue/test-utils'

afterEach(() => vi.restoreAllMocks())

test('getWordCount and getCharCount edge cases and next/back call mapped mutations and emit', () => {
  const store: any = { state: { annotationManager: { inputSentences: [{ text: 'one two  three' }], annotations: [{ entities: [] }] }, currentIndex: 0 } }
  const emitter = { emit: vi.fn() }
  const vm = shallowMount(InfoBar, { global: { mocks: { $store: store, $q: { dark: { isActive: false } } } } })

  // getWordCount handles null
  expect((vm.vm as any).getWordCount(null)).toBe(0)
  expect((vm.vm as any).getCharCount(null)).toBe(0)

  // normal string
  expect((vm.vm as any).getWordCount(' a b ')).toBe(2)
  expect((vm.vm as any).getCharCount('abc')).toBe(3)

  // test next/back calling mapped mutation functions via instance override
  ;(vm.vm as any).nextSentence = vi.fn()
  ;(vm.vm as any).previousSentence = vi.fn()
  ;(vm.vm as any).emitter = { emit: vi.fn() }

  ;(vm.vm as any).next()
  expect((vm.vm as any).nextSentence).toHaveBeenCalled()
  expect((vm.vm as any).emitter.emit).toHaveBeenCalledWith('tokenizeCurrentSentence')

  ;(vm.vm as any).back()
  expect((vm.vm as any).previousSentence).toHaveBeenCalled()
  expect((vm.vm as any).emitter.emit).toHaveBeenCalledWith('tokenizeCurrentSentence')
})
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import InfoBar from '../../src/components/toolbars/InfoBar.vue'

const mockStore = {
  state: { currentIndex: 0, annotationManager: { inputSentences: [{ id: 0, text: 'x' }], annotations: [{ entities: [] }] } },
  commit: () => {},
}

describe('InfoBar component', () => {
  it('renders counts', () => {
    const wrapper = mount(InfoBar as any, {
      global: {
        mocks: { $store: mockStore, $q: { dark: { isActive: false } } },
      },
    })
    expect(wrapper.text()).toContain('Words')
  })
})
