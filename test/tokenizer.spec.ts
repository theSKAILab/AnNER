import { describe, it, expect } from 'vitest'
import Tokenizer from '../src/components/managers/Tokenizer'

describe('Tokenizer', () => {
  it('tokenize splits words and punctuation', () => {
    const tokens = Tokenizer.tokenize("Hello, world! This is $5.")
    expect(tokens.length).toBeGreaterThan(0)
    expect(tokens).toContain('Hello')
  })

  it('span_tokenize returns spans with positions and text', () => {
    const spans = Tokenizer.span_tokenize('ab cd')
    expect(spans.length).toBeGreaterThan(0)
    expect(spans[0][2]).toBe('ab')
    expect(spans[1][2]).toBe('cd')
  })
})
