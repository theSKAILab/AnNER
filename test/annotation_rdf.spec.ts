import { describe, it, expect } from 'vitest'
import { AnnotationManager, Paragraph, Entity, History } from '../src/components/managers/AnnotationManager'
import { LabelManager, Label } from '../src/components/managers/LabelManager'

describe('Annotation RDF and entity history', () => {
  it('toRDF generates document and labels and assigns ids if missing', () => {
    const lm = new LabelManager()
    lm.addLabel('X')
    const e = new Entity(0,1,[], lm.currentLabel, false, 'Candidate')
    const p = new Paragraph('hello',[e.toJSON('me')])
    const am = new AnnotationManager([[null,'hello',{entities:[e.toJSON('me')]}]])
    const rdf = am.toRDF(lm)
    expect(rdf).toContain('onner:directlyContainsDocumentPart')
    expect(rdf).toContain('Label')
  })

  it('History.toRDF emits a string containing status and label id', () => {
    const h = new History('Accepted','SomeLabel','me','2020-01-01T00:00:00Z')
    const labelManager = new LabelManager()
    labelManager.addLabel('SomeLabel')
    const e = new Entity(0,1,[h], labelManager.getLabelByName('SomeLabel'))
    const p = new Paragraph('hi',[e.toJSON('me')])
    const out = h.toRDF(e, labelManager)
    expect(typeof out).toBe('string')
    expect(out).toContain('statusAssignedBy')
  })
})
