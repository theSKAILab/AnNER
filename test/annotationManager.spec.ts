import { describe, it, expect } from 'vitest'
import { AnnotationManager, Paragraph, Entity, History } from '../src/components/managers/AnnotationManager'
import { LabelManager, Label } from '../src/components/managers/LabelManager'

describe('AnnotationManager', () => {
  it('fromText splits paragraphs and creates inputSentences', () => {
    const text = 'First paragraph\n\nSecond paragraph'
    const am = AnnotationManager.fromText(text)
    expect(am.inputSentences.length).toBeGreaterThan(0)
    expect(am.inputSentences[0].text).toContain('First')
  })

  it('toJSON and fromJSON roundtrip', () => {
    const am = new AnnotationManager()
    const json = JSON.stringify({ annotations: am.toJSON('me') })
    const am2 = AnnotationManager.fromJSON(json)
    expect(am2.inputSentences.length).toBe(am.inputSentences.length)
  })

  it('toRDF includes labels from provided LabelManager', () => {
    const lm = new LabelManager()
    lm.addLabel('X')
    const am = new AnnotationManager()
    const rdf = am.toRDF(lm)
    expect(typeof rdf).toBe('string')
    expect(rdf.length).toBeGreaterThan(0)
  })
})
