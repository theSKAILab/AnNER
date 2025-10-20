import { describe, it, expect } from 'vitest'
import { LabelManager, Label } from '../src/components/managers/LabelManager'

describe('LabelManager', () => {
  it('constructs with initial labels and sets currentLabel', () => {
    const initial = [new Label(1, 'PERSON', 'red-11')]
    const lm = new LabelManager(initial)
    expect(lm.allLabels.length).toBe(1)
    expect(lm.currentLabel).toBeDefined()
    expect(lm.currentLabel?.name).toBe('PERSON')
  })

  it('adds and deletes labels and generates colors deterministically', () => {
    const lm = new LabelManager()
    lm.addLabel('PERSON')
    expect(lm.allLabels.length).toBe(1)
    expect(lm.getLabelByName('PERSON')?.name).toBe('PERSON')
    const cid = lm.getLabelId('PERSON')
    expect(cid).toBe(1)
    lm.addLabel('LOCATION')
    expect(lm.lastId).toBe(2)
    lm.deleteLabel('PERSON')
    expect(lm.getLabelByName('PERSON')).toBeUndefined()
  })

  it('doesAlreadyExist is case-insensitive', () => {
    const lm = new LabelManager()
    lm.addLabel('Person')
    expect(lm.doesAlreadyExist('person')).toBe(true)
  })

  it('toJSON and fromJSON roundtrip', () => {
    const lm = new LabelManager()
    lm.addLabel('A')
    const json = lm.toJSON()
    const lm2 = LabelManager.fromJSON(json)
    expect(lm2.allLabels.length).toBe(1)
    expect(lm2.allLabels[0].name).toBe('A')
  })
})
