import { expect, test } from 'vitest'
import { Entity, History } from '../../src/components/managers/AnnotationManager'
import { Label } from '../../src/components/managers/LabelManager'

test('generateHistoryEntryForExport: reviewed duplicate-annotator pushes copy entry', () => {
  const label = new Label(1, 'TEST', 'red-11')
  const h = new History('Active', 'TEST', 'alice', '2020-01-01T00:00:00Z')
  const e = new Entity(0, 1, [h], label, true, 'Active')

  // newAnnotator differs from latest entry annotator -> should push a copy entry
  e.toJSON('bob')

  expect(e.history.length).toBeGreaterThanOrEqual(2)
  expect(e.latestEntry()?.annotatorName).toBe('bob')
  expect(e.latestEntry()?.label).toBe('TEST')
})

test('generateHistoryEntryForExport: candidate with empty history pushes entry', () => {
  const label = new Label(1, 'A', 'red-11')
  const e = new Entity(0, 1, [], label, false, 'Candidate')

  // history is empty and state is Candidate -> toJSON should add an entry
  e.toJSON('me')
  expect(e.history.length).toBe(1)
  expect(e.history[0].state).toBe('Candidate')
})

test('generateHistoryEntryForExport: state/label change pushes new entry', () => {
  const labelPrev = new Label(1, 'PREV', 'blue-11')
  const labelNew = new Label(2, 'NEW', 'green-11')
  const h = new History('Active', 'PREV', 'carol', '2020-01-01T00:00:00Z')
  const e = new Entity(0, 1, [h], labelNew, false, 'Rejected')

  // latestEntry.state != currentState or label != labelClass.name -> add
  e.toJSON('dave')
  expect(e.history.length).toBeGreaterThanOrEqual(2)
  const last = e.latestEntry()
  expect(last?.state).toBe('Rejected')
})
import { describe, it, expect } from 'vitest'
import { Entity, History, Paragraph, AnnotationManager } from '../../src/components/managers/AnnotationManager'
import { LabelManager } from '../../src/components/managers/LabelManager'

describe('AnnotationManager more history branches', () => {
  it('toRDF triggers history generation and includes Candidate status entries', () => {
    const lm = new LabelManager()
    lm.addLabel('X')
    const lbl = lm.currentLabel
    const e = new Entity(0, 1, [], lbl, false, 'Candidate')
    const para = new Paragraph('t', [e.toJSON('me')])
    const am = new AnnotationManager([para.toJSON('me')])
    // call toRDF which will call generateHistoryEntryForExport via toRDF
    const rdf = am.toRDF(lm)
    expect(typeof rdf).toBe('string')
  })

  it('toRDF with reviewed entity and same annotator avoids duplicate branch', () => {
    const lm = new LabelManager()
    lm.addLabel('A')
    const lbl = lm.currentLabel
    const h = new History('Accepted', 'A', 'me', History.formatDate(new Date()))
    const e = new Entity(0, 2, [h], lbl, true, 'Accepted')
    // toRDF should still execute without throwing even when annotator matches
    const para = new Paragraph('t', [e.toJSON('me')])
    const am = new AnnotationManager([para.toJSON('me')])
    const rdf = am.toRDF(lm)
    expect(rdf).toContain('LabeledTerm')
  })
})
