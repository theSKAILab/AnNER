import { describe, it, expect } from 'vitest'
import { Paragraph, Entity, History } from '../src/components/managers/AnnotationManager'
import { Label, LabelManager } from '../src/components/managers/LabelManager'

describe('AnnotationManager extra branches', () => {
  it('Paragraph.toRDF uses EndOfDocument branch when paragraphNumber >= paragraphIds.length', () => {
    const p = new Paragraph('text')
    p.id = 'doc_p0'
    const lm = new LabelManager()
    // paragraphIds length 1, pass paragraphNumber 1 to trigger else branch
    const out = p.toRDF(1, 'doc123', ['data:doc_p0'], lm)
    expect(out).toContain(`data:doc123_EndOfDocument`)
  })

  it('Paragraph.fromJSON handles empty entities array', () => {
    const p = Paragraph.fromJSON([null, 'hi', { entities: [] }])
    expect(Array.isArray(p.entities)).toBe(true)
    expect(p.entities.length).toBe(0)
  })

  it('Paragraph.toRDF uses this.id when paragraphNumber < paragraphIds.length', () => {
    const p = new Paragraph('x')
    // set id to include data: prefix so string matches generated RDF
    p.id = 'data:pid0'
    const lm = new LabelManager()
    const out = p.toRDF(0, 'docid', ['data:pid0','data:pid1'], lm)
    expect(out).toContain('onner:nextDocumentPart data:pid0')
  })

  it('Paragraph.toJSON calls entity.toJSON via JSONFormat', () => {
    const lm = new LabelManager()
    lm.addLabel('A')
    const e = new (class {
      toJSON = (a: string) => [null, 0, 1, []]
    })()
    const p = new Paragraph('z', [e.toJSON('me') as any])
    const j = p.toJSON('me')
    expect(Array.isArray(j)).toBe(true)
    expect(j[1]).toBe('z')
  })

  it('Entity.toJSON pushes new entry when latestEntry label differs from labelClass', () => {
    const lblA = new Label(10, 'A', 'red-11')
    const lblB = new Label(11, 'B', 'blue-11')
    const initialHistory = new History('Accepted', 'A', 'alice', '2020-01-01T00:00:00Z')
    // entity has labelClass B but latest history label A -> label mismatch
    const e = new Entity(0, 2, [initialHistory], lblB, false, 'Accepted')
    e.toJSON('me')
    expect(e.history.length).toBe(2)
    expect(e.history[e.history.length - 1].annotatorName).toBe('me')
  })

  it('Entity.toJSON adds history entry when history is empty and state is Candidate', () => {
    const lbl = new Label(1, 'L', 'red-11')
    const e = new Entity(0, 1, [], lbl, false, 'Candidate')
    expect(e.history.length).toBe(0)
    e.toJSON('me')
    expect(e.history.length).toBe(1)
    expect(e.history[0].annotatorName).toBe('me')
  })

  it('Entity.toJSON pushes annotated-entry when reviewed and latestEntry matches current state/label but different annotator', () => {
    const lbl = new Label(2, 'Tag', 'blue-11')
    const initialHistory = new History('Accepted', 'Tag', 'alice', '2020-01-01T00:00:00Z')
    const e = new Entity(0, 2, [initialHistory], lbl, true, 'Accepted')
    // latestEntry annotator is 'alice' and newAnnotator will be 'me', should trigger reviewed branch
    e.toJSON('me')
    expect(e.history.length).toBe(2)
    expect(e.history[e.history.length - 1].annotatorName).toBe('me')
    expect(e.history[e.history.length - 1].state).toBe(initialHistory.state)
  })

  it('Entity.toJSON pushes new entry when latestEntry state differs from currentState', () => {
    const lbl = new Label(3, 'Other', 'green-11')
    const initialHistory = new History('Candidate', 'Other', 'bob', '2020-01-01T00:00:00Z')
    const e = new Entity(0, 2, [initialHistory], lbl, false, 'Accepted')
    e.toJSON('me')
    expect(e.history.length).toBe(2)
    expect(e.history[e.history.length - 1].annotatorName).toBe('me')
  })
})
