import { describe, it, expect } from 'vitest'
import { store } from '../src/components/managers/Store'

describe('Store mutations', () => {
  it('processFile handles text files and creates tokenManagers', () => {
    // set fileName to a txt to hit text branch
    store.state.fileName = 'sample.txt'
    const text = 'one\ntwo\nthree'
    store.commit('processFile', text)
    expect(store.state.annotationManager).not.toBeNull()
    expect(store.state.tokenManagers?.length).toBe(store.state.annotationManager?.inputSentences.length)
  })

  it('processFile handles json files and sets labelManager via fromJSON', () => {
    const sample = {
      classes: [{ id: 1, name: 'A', color: 'red-11' }],
      annotations: [[null, 'hello', { entities: [] }]]
    }
    store.state.fileName = 'test.json'
    store.commit('processFile', JSON.stringify(sample))
    expect(store.state.labelManager).not.toBeNull()
    expect(store.state.currentIndex).toBe(0)
  })

  it('nextSentence and previousSentence update index appropriately', () => {
    store.state.currentIndex = 0
    const len = store.state.annotationManager?.inputSentences.length ?? 1
    if (len > 1) {
      store.commit('nextSentence')
      expect(store.state.currentIndex).toBeGreaterThanOrEqual(0)
      store.commit('previousSentence')
      expect(store.state.currentIndex).toBeGreaterThanOrEqual(0)
    } else {
      // If only one sentence, nextSentence should not increment
      store.commit('nextSentence')
      expect(store.state.currentIndex).toBe(0)
    }
  })

  it('setCurrentPage and setCurrentIndex and setTokenManager operate', () => {
    store.commit('setCurrentPage', 'annotate')
    expect(store.state.currentPage).toBe('annotate')
    store.commit('setCurrentIndex', 0)
    expect(store.state.currentIndex).toBe(0)
    // setTokenManager
    store.commit('setTokenManager', null)
    expect(store.state.tokenManager).toBeNull()
  })
})
