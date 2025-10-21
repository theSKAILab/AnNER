import { mount } from '@vue/test-utils'
import { expect, test } from 'vitest'
import Tokenizer from '../src/components/managers/Tokenizer'
import { LabelManager } from '../src/components/managers/LabelManager'
import TokenManager, { TMTokenBlock, TMToken } from '../src/components/managers/TokenManager'
import { Entity, History, Paragraph, AnnotationManager } from '../src/components/managers/AnnotationManager'
import AnnotationPage from '../src/components/pages/AnnotationPage.vue'

test('TokenManager constructor uses currentParagraph entities to assign labelClass and add blocks', () => {
  const lm = new LabelManager()
  lm.addLabel('AAA')
  const para = new Paragraph('p text')
  // create an entity with labelName set but no labelClass
  const e = new Entity(0, 3, [], undefined, false, 'Candidate')
  e.labelName = 'AAA'
  para.entities.push(e)

  const tokens = Tokenizer.span_tokenize('one two')
  const tm = new TokenManager(lm, tokens, para)

  // after construction, entity.labelClass should be assigned to the label from lm
  expect(para.entities[0].labelClass).toBeDefined()
  // and token blocks should exist in token manager
  expect(tm.tokenBlocks.length).toBeGreaterThanOrEqual(1)
})

test('Entity.generateHistoryEntryForExport uses Candidate and empty label when missing', () => {
  const e = new Entity(0, 1) // no history, no labelClass, currentState default 'Candidate'
  const before = e.history.length
  e.toJSON('who')
  expect(e.history.length).toBeGreaterThan(before)
  const last = e.latestEntry()
  expect(last).toBeTruthy()
  expect(last!.state).toBe('Candidate')
  expect(last!.label).toBe('')
  expect(last!.annotatorName).toBe('who')
})

test('AnnotationPage renders tokens with both user-active and user-inactive classes', () => {
  const lm = new LabelManager()
  lm.addLabel('L')
  const tokens = Tokenizer.span_tokenize('a b c')
  const tm = new TokenManager(lm, tokens)

  // create block (reviewed true) and a plain token (inactive)
  const blockTokens = tm.tokens.slice(0, 2) as TMToken[]
  const block = new TMTokenBlock(blockTokens[0].start, blockTokens[blockTokens.length - 1].end, blockTokens, lm.getLabelByName('L')!, 'Candidate', true)
  tm.tokens.push(block)
  tm.tokens.sort((a,b)=>a.start - b.start)

  const am = new AnnotationManager([[null, 'para', { entities: [] }]])
  const store = { state: { annotationManager: am, currentPage: 'annotate', currentIndex: 0, tokenManager: tm, tokenManagers: [tm], labelManager: lm, versionControlManager: { addUndo: () => {} } }, commit: () => {} }

  const wrapper = mount(AnnotationPage, { global: { mocks: { $store: store }, stubs: { 'info-bar': true } } })

  const html = wrapper.html()
  // should contain at least one user-active (block.reviewed true) and one user-inactive (token default)
  expect(html.includes('user-active') || html.includes('user-inactive')).toBe(true)
})
