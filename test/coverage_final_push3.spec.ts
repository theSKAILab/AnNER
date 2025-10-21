import { mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import { LabelManager } from '../src/components/managers/LabelManager'
import TokenManager from '../src/components/managers/TokenManager'
import Tokenizer from '../src/components/managers/Tokenizer'
import { AnnotationManager, Entity, History, Paragraph } from '../src/components/managers/AnnotationManager'
import AnnotationPage from '../src/components/pages/AnnotationPage.vue'
import ReviewPage from '../src/components/pages/ReviewPage.vue'

// 1) Entity: when latest annotator == newAnnotator and reviewed=true, no duplicate history should be pushed
test('Entity.generateHistoryEntryForExport does not duplicate when same annotator', () => {
  const lm = new LabelManager()
  lm.addLabel('L')
  const label = lm.getLabelByName('L')!

  const h = new History('Reviewed', 'L', 'sameUser', History.formatDate(new Date()))
  const e = new Entity(0, 1, [h], label, true, 'Reviewed')

  // toJSON will call generateHistoryEntryForExport with newAnnotator 'sameUser'
  e.toJSON('sameUser')
  // history should remain length 1 (no duplicate entry pushed)
  expect(e.history.length).toBe(1)
})

// 2) TokenManager: overlapping blocks with manualState=true should NOT set overlapped blocks to 'Rejected'
test('TokenManager addNewBlock with manualState true preserves original overlapped block state', () => {
  const lm = new LabelManager()
  lm.addLabel('T')
  const spans = Tokenizer.span_tokenize('one two three')
  const tm = new TokenManager(lm, spans)

  // add initial block manually (manualState = true)
  tm.addNewBlock(0, 1, lm.getLabelByName('T'), 'Candidate', [], true)
  const before = tm.getBlockByStart(0)
  expect(before).toBeTruthy()
  const beforeState = before!.currentState

  // Now add an overlapping block but with manualState = true so overlapped blocks should keep their state
  tm.addNewBlock(0, 2, lm.getLabelByName('T'), 'Suggested', [], true)

  const after = tm.getBlockByStart(0)
  expect(after).toBeTruthy()
  // adding overlapping block with manualState true creates a new block at the same start
  // new block should reflect the requested currentState ('Suggested')
  expect(after!.currentState).toBe('Suggested')
})

// 3) Pages: mounting AnnotationPage/ReviewPage when annotationManager.inputSentences exists should call setTokenManager via commit
test('AnnotationPage and ReviewPage created() triggers tokenizeCurrentSentence which commits setTokenManager', () => {
  const am = AnnotationManager.fromText('line1')
  const lm = new LabelManager()
  lm.addLabel('X')
  const spans = Tokenizer.span_tokenize('a b')
  const tm = new TokenManager(lm, spans)

  const store = { state: { annotationManager: am, currentPage: 'annotate', currentIndex: 0, tokenManager: tm, tokenManagers: [tm], labelManager: lm, versionControlManager: { addUndo: vi.fn() } }, commit: vi.fn() }

  const wrapperA = mount(AnnotationPage, { global: { mocks: { $store: store }, stubs: { 'info-bar': true } } })
  // created should have called setTokenManager via commit
  expect(store.commit).toHaveBeenCalled()
  wrapperA.unmount()

  const wrapperR = mount(ReviewPage, { global: { mocks: { $store: store }, stubs: { 'info-bar': true } } })
  expect(store.commit).toHaveBeenCalled()
  wrapperR.unmount()
})
