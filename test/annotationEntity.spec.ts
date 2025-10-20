import { describe, it, expect } from 'vitest'
import { Paragraph, Entity, History } from '../src/components/managers/AnnotationManager'
import { Label } from '../src/components/managers/LabelManager'

describe('Paragraph/Entity/History', () => {
  it('History.formatDate returns ISO-like string', () => {
    const s = History.formatDate(new Date('2020-01-02T03:04:05Z'))
    // expect format YYYY-MM-DDTHH:MM:SSZ
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(s)).toBe(true)
  })

  it('Entity toJSON and fromJSON maintain fields and toRDF returns string', () => {
    const h = new History('Candidate','L','me','2020-01-01T00:00:00Z')
    const entity = new Entity(0,1,[h], new Label(1,'L','red-11'), true, 'Accepted')
    const json = entity.toJSON('me')
    const recovered = Entity.fromJSON(json)
    expect(recovered.start).toBe(0)
    const para = new Paragraph('hello',[json])
    const rdf = recovered.toRDF(para, new (class { getLabelId() { return 1 }})() as any)
    expect(typeof rdf).toBe('string')
  })
})
