import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import StartPage from '../../src/components/pages/StartPage.vue'

describe('StartPage template and loadFile binding', () => {
  it('calls store.commit via mapped loadFile mutation', () => {
    const commit = vi.fn()
    const store: any = { commit }
    const wrapper = mount(StartPage as any, { global: { mocks: { $store: store, $q: { dark: { isActive: false } } } } })
    const fakeFile = new File(['x'], 'doc.txt', { type: 'text/plain' })
    // call the mapped mutation directly
    ;(wrapper.vm as any).loadFile(fakeFile)
    expect(commit).toHaveBeenCalledWith('loadFile', fakeFile)
  })
})
