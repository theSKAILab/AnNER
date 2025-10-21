import { expect, test } from 'vitest'
import { AnnotationManager, Entity, History, Paragraph } from '../../src/components/managers/AnnotationManager'
import { Label, LabelManager } from '../../src/components/managers/LabelManager'

test('AnnotationManager.generateIDsForExport assigns ids when missing and toRDF uses EndOfDocument branch', () => {
  const lm = new LabelManager()
  lm.addLabel('L')
  const e = new Entity(0, 1, [], lm.currentLabel, false, 'Candidate')
  const para = new Paragraph('text', [e.toJSON('me')])
  const am = new AnnotationManager([para.toJSON('me')])
  const rdf = am.toRDF(lm)
  expect(rdf).toContain('EndOfDocument')
})

test('Entity.generateHistoryEntryForExport duplicate-annotator branch when reviewed and same state/label but different annotator', () => {
  const lm = new LabelManager()
  lm.addLabel('Z')
  const label = lm.currentLabel
  const h = new History('Active', 'Z', 'old', '2020-01-01T00:00:00Z')
  const e = new Entity(0, 2, [h], label, true, 'Active')
  // export with different annotator should push a copy
  e.toJSON('new')
  expect(e.history.length).toBeGreaterThanOrEqual(2)
})
