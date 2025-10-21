import { describe, it, expect } from 'vitest'
import { Entity, History } from '../../src/components/managers/AnnotationManager'
import { Label, LabelManager } from '../../src/components/managers/LabelManager'

describe('AnnotationManager Entity history branches', () => {
  it('pushes history when entity is Candidate and has no history', () => {
    const lm = new LabelManager()
    lm.addLabel('X')
    const lbl = lm.currentLabel as Label

    // Entity constructed without history => default currentState Candidate
    const e = new Entity(0, 1, [], lbl, false, 'Candidate')
    expect(e.history.length).toBe(0)
    // toJSON triggers generateHistoryEntryForExport
    e.toJSON('me')
    expect(e.history.length).toBeGreaterThanOrEqual(1)
  })

  it('adds duplicate-latest-entry branch when reviewed and latest matches state/label but different annotator', () => {
    const lm = new LabelManager()
    lm.addLabel('X')
    const lbl = lm.currentLabel as Label

    // Prepare entity with a latest history entry
    const h = new History('Accepted', 'X', 'other', History.formatDate(new Date()))
    const e = new Entity(0, 1, [h], lbl, true, 'Accepted')
    // now call toJSON with a different annotator -> branch where reviewed && latestEntry differs by annotator
    const before = e.history.length
    e.toJSON('me')
    expect(e.history.length).toBeGreaterThan(before)
    expect(e.history[e.history.length - 1].annotatorName).toBe('me')
  })

  it('adds new history when latestEntry state or label differ', () => {
    const lm = new LabelManager()
    lm.addLabel('A')
    lm.addLabel('B')
    const lblA = lm.getLabelByName('A') as Label
    const lblB = lm.getLabelByName('B') as Label

    // latest entry has state X but entity currentState is different
    const h = new History('Candidate', 'A', 'me', History.formatDate(new Date()))
    const e = new Entity(0, 2, [h], lblB, false, 'Accepted')
    const before = e.history.length
    e.toJSON('me')
    expect(e.history.length).toBeGreaterThan(before)
  })
})
