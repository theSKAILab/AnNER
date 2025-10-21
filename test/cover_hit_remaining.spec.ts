import { expect, test, vi } from 'vitest'
import Tokenizer from '../src/components/managers/Tokenizer'
import { LabelManager } from '../src/components/managers/LabelManager'
import TokenManager, { TMTokenBlock, TMToken } from '../src/components/managers/TokenManager'
import { Entity, History, Paragraph } from '../src/components/managers/AnnotationManager'
import AnnotationPage from '../src/components/pages/AnnotationPage.vue'
import ReviewPage from '../src/components/pages/ReviewPage.vue'
import { mount } from '@vue/test-utils'

test('Entity.generateHistoryEntryForExport triggers RDF Export duplicate-annotator branch', () => {
  const lm = new LabelManager()
  lm.addLabel('Z')
  const label = lm.getLabelByName('Z')!
  // create history with same state and label but different annotator
  const hist = new History('Candidate', 'Z', 'old-annotator', History.formatDate(new Date()))
  const e = new Entity(0, 3, [hist], label, true, 'Candidate')

  const para = new Paragraph('abc')
  para.entities.push(e)

  // calling toRDF will call generateHistoryEntryForExport with 'RDF Export'
  const rdf = e.toRDF(para, lm)
  // the history should have an extra entry pushed
  expect(e.history.length).toBeGreaterThan(1)
  expect(e.latestEntry()!.annotatorName).toBe('RDF Export')
})

test('Entity.generateHistoryEntryForExport pushes when Candidate and history empty', () => {
  const lm = new LabelManager()
  lm.addLabel('C')
  const label = lm.getLabelByName('C')!
  const e = new Entity(0, 2, [], label, false, 'Candidate')

  // toJSON triggers generateHistoryEntryForExport
  const json = e.toJSON('tester')
  expect(e.history.length).toBeGreaterThan(0)
  expect(e.latestEntry()!.annotatorName).toBe('tester')
})

test('Entity.generateHistoryEntryForExport pushes when latestEntry differs', () => {
  const lm = new LabelManager()
  lm.addLabel('D')
  const label = lm.getLabelByName('D')!
  const hist = new History('Suggested', 'D', 'a', History.formatDate(new Date()))
  // entity constructed with history latest state Suggested but currentState set to Candidate
  const e = new Entity(0, 2, [hist], label, false, 'Candidate')

  e.toJSON('u')
  // latestEntry state should now equal the currentState (Candidate) or a new history pushed
  expect(e.history.length).toBeGreaterThan(1)
})

test('TokenManager addNewBlock uses targetedBlocks[last].end when blocks exist and not overlapping', () => {
  const lm = new LabelManager()
  lm.addLabel('T')
  const tokens = Tokenizer.span_tokenize('one two three four five')
  const tm = new TokenManager(lm, tokens)

  // create two TMTokenBlock entries so that blocksInRange returns them
  const b1Tokens = tm.tokens.slice(0,2) as TMToken[]
  const b2Tokens = tm.tokens.slice(2,4) as TMToken[]
  const b1 = new TMTokenBlock(b1Tokens[0].start, b1Tokens[b1Tokens.length-1].end, b1Tokens, lm.getLabelByName('T')!, 'Candidate')
  const b2 = new TMTokenBlock(b2Tokens[0].start, b2Tokens[b2Tokens.length-1].end, b2Tokens, lm.getLabelByName('T')!, 'Candidate')
  tm.tokens.push(b1, b2)
  tm.tokens.sort((a,b)=>a.start - b.start)

  // ensure isOverlapping returns null for our selection
  const selStart = b1.start
  const selEnd = b2.end

  tm.addNewBlock(selStart, selEnd, lm.getLabelByName('T'), 'Suggested', [], false)

  const created = tm.tokenBlocks.find(tb => tb.start === selStart)
  expect(created).toBeDefined()
  // end must equal targetedBlocks[targetedBlocks.length -1].end which is b2.end
  expect(created!.end).toBe(b2.end)
})

test('Pages register/unregister document mouseup listeners (AnnotationPage & ReviewPage)', () => {
  const lm = new LabelManager()
  lm.addLabel('L')
  const tokens = Tokenizer.span_tokenize('one')
  const tm = new TokenManager(lm, tokens)

  const am = { inputSentences: [] }
  const store = { state: { annotationManager: am, currentPage: 'annotate', currentIndex: 0, tokenManager: tm, tokenManagers: [tm], labelManager: lm, versionControlManager: { addUndo: vi.fn() } }, commit: vi.fn() }

  const addSpy = vi.spyOn(document, 'addEventListener')
  const remSpy = vi.spyOn(document, 'removeEventListener')

  const a = mount(AnnotationPage, { global: { mocks: { $store: store }, stubs: { 'info-bar': true } } })
  a.unmount()
  expect(addSpy).toHaveBeenCalledWith('mouseup', expect.any(Function))
  expect(remSpy).toHaveBeenCalled()

  const r = mount(ReviewPage, { global: { mocks: { $store: store, emitter: { on: vi.fn(), off: vi.fn() } }, stubs: { 'info-bar': true } } })
  r.unmount()
  expect(addSpy).toHaveBeenCalledWith('mouseup', expect.any(Function))
  expect(remSpy).toHaveBeenCalled()
})
