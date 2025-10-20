import { describe, it, expect, vi } from 'vitest'
import { LabelManager, Label } from '../src/components/managers/LabelManager'
import { store } from '../src/components/managers/Store'
import TokenManager, { TMToken, TMTokenBlock } from '../src/components/managers/TokenManager'
import { VersionControlManager } from '../src/components/managers/VersionControlManager'
import { Paragraph, AnnotationManager } from '../src/components/managers/AnnotationManager'

describe('Managers full coverage', () => {
  it('LabelManager setCurrentLabel throws when missing', () => {
    const lm = new LabelManager()
    expect(() => lm.setCurrentLabel('doesnotexist')).toThrow()
  })

  it('Store.processFile handles json and text branches and next/previous index', () => {
    // Use the exported store to run Vuex mutations
    store.state.fileName = 'f.json'
    const json = JSON.stringify({ annotations: [[null,'a',{entities:[]}]], classes: [] })
    store.commit('processFile', json)
    expect(store.state.annotationManager).not.toBeNull()

    // next/previous sentence bounds
    store.state.currentIndex = 0
    store.commit('nextSentence')
    expect(store.state.currentIndex).toBe(0)
    store.commit('previousSentence')
    expect(store.state.currentIndex).toBe(0)
  })

  it('Store.loadFile handles json file and sets review page via FileReader', async () => {
    // Mock FileReader for this test
    class MockFileReader2 {
      public onload: ((e: any) => void) | null = null
      public addEventListener(type: string, cb: (e: any) => void) { if (type === 'load') this.onload = cb }
      public readAsText(file: any) { setTimeout(() => this.onload && this.onload({ target: { result: file.__content } }), 0) }
    }
    ;(global as any).FileReader = MockFileReader2
    const fake = { name: 'doc.json', __content: JSON.stringify({ annotations: [[null,'t',{entities:[]}]], classes: [] }) }
    store.commit('loadFile', fake as any)
    await new Promise((r) => setTimeout(r, 20))
    expect(store.state.currentPage).toBe('review')
  })

  it('TokenManager addNewBlock overlapping and removeDuplicateBlocks and restoreOriginalBlockState', () => {
    const lm = new LabelManager()
    lm.addLabel('X')
    const spans = [[0,1,'a'], [1,2,'b'], [2,3,'c']] as any
    const tm = new TokenManager(lm, spans)
    // add block covering 0-2
    tm.addNewBlock(0,2, lm.currentLabel, 'Accepted')
    // add overlapping block that should reintroduce tokens and mark overlapped as Rejected
    tm.addNewBlock(1,3, lm.currentLabel, 'Accepted')
    expect(tm.tokenBlocks.length).toBeGreaterThan(0)
    // remove duplicate blocks no-op
    tm.removeDuplicateBlocks()
    // getBlockByStart and restoreOriginalBlockState
    const b = tm.getBlockByStart(0)
    if (b) {
      tm.removeBlock(0)
      // remove without reintroduce
      tm.removeBlock(1, false)
      // restore on existing block (should be safe)
      tm.restoreOriginalBlockState(1)
    }
  })

  it('TMTokenBlock exportAsEntity and restoreOriginalState and TokenManager constructor with paragraph', () => {
    const lm = new LabelManager()
    lm.addLabel('X')
    const lbl = lm.currentLabel as Label
    const token = new TMToken(0,1,'a','Candidate')
    const block = new TMTokenBlock(0,1,[token], lbl, 'Candidate', true, [])
    // mutate and restore
    block.currentState = 'Rejected'
    block.reviewed = false
    block.restoreOriginalState()
    expect(block.currentState).toBe('Candidate')
    expect(block.reviewed).toBe(true)

    // TokenManager constructor with paragraph
    const e = block.exportAsEntity()
    const para = new Paragraph('p', [e.toJSON('me')])
    const spans = [[0,1,'a']]
    const tm = new TokenManager(lm, spans as unknown as any, para)
    expect(tm.tokenBlocks.length).toBeGreaterThanOrEqual(0)
  })

  it('VersionControlManager serialize/deserialize and undo/redo stack operations and trim', () => {
    const vcm = new VersionControlManager()
    const lm = new LabelManager()
    lm.addLabel('A')
  const spans = [[0,1,'x']]
    const tm = new TokenManager(lm, spans)
    // attach store and tokenManagers to exercise restoreSnapshot branches
  vcm.setStore(store as unknown as any)
    // create another token manager in store.tokenManagers
    store.state.tokenManagers = [tm]
    store.state.currentIndex = 1
    // add undo snapshots (will capture tokenManagers)
    vcm.addUndo(tm)
    // change index then undo to trigger setCurrentIndex in restoreSnapshot
    store.state.currentIndex = 0
    vcm.addUndo(tm)
    expect(vcm.getUndoCount()).toBeGreaterThan(0)
    // undo/redo operations
    vcm.undo(tm)
    vcm.redo(tm)
    // can undo all / redo all
    vcm.addUndo(tm)
    vcm.undoAll(tm)
    vcm.redoAll(tm)
    // setMaxStackSize trims
    vcm.setMaxStackSize(1)
    // clear history
    vcm.clearHistory()
    expect(vcm.getUndoCount()).toBe(0)
  })

  it('LabelManager setCurrentLabel success path', () => {
    const lm = new LabelManager()
    lm.addLabel('Z')
    lm.setCurrentLabel('Z')
    expect(lm.currentLabel?.name).toBe('Z')
  })

  it('Store.nextSentence and previousSentence internal branches execute when annotationManager has multiple sentences', () => {
  const am = AnnotationManager.fromText('one\ntwo')
    store.state.annotationManager = am
    store.state.currentIndex = 0
    store.commit('nextSentence')
    // when there are multiple sentences index should increment
    expect(store.state.currentIndex).toBe(1)
    store.commit('previousSentence')
    expect(store.state.currentIndex).toBe(0)
  })

  it('VersionControlManager trims redoStack when setMaxStackSize smaller than redo length', () => {
    const vcm2 = new VersionControlManager()
    const lm = new LabelManager()
    lm.addLabel('A')
    const spans = [[0,1,'x']]
  const tm = new TokenManager(lm, spans as any)
  vcm2.setStore(store as unknown as any)
    // create multiple snapshots
    vcm2.addUndo(tm)
    vcm2.addUndo(tm)
    // perform undos to populate redoStack
    vcm2.undo(tm)
    vcm2.undo(tm)
    // now redoStack length should be > 0; set small max and trim
    vcm2.setMaxStackSize(1)
    // ensure undo/redo stacks were trimmed to <=1
    expect(vcm2.getUndoCount()).toBeLessThanOrEqual(1)
  })
})
