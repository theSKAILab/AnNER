import { describe, it, expect, beforeEach } from 'vitest'
import { store } from '../src/components/managers/Store'

// Mock FileReader globally for this suite
class MockFileReader {
  public result: string | null = null
  public onload: ((e: any) => void) | null = null
  public addEventListener(type: string, cb: (e: any) => void) {
    if (type === 'load') this.onload = cb
  }
  public readAsText(file: any) {
    // simulate async load
    setTimeout(() => {
      const e: any = { target: { result: file.__content } }
      this.onload && this.onload(e)
    }, 0)
  }
}

describe('Store.loadFile (mock FileReader)', () => {
  beforeEach(() => {
    // attach global FileReader
    ;(global as any).FileReader = MockFileReader
  })

  it('loadFile reads and processes a txt file via mocked FileReader', async () => {
    const fake = { name: 'doc.txt', __content: 'A\nB\nC' }
    store.commit('loadFile', fake as any)
    // wait a tick for async read
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(store.state.annotationManager).not.toBeNull()
    expect(store.state.tokenManagers?.length).toBeGreaterThan(0)
  })
})
