/**
 * Tokenizer Spans
 * @description This type represents the spans of tokens in a text, including their start and end indices and the token itself.
 * @property {number} start - The start index of the token in the text.
 * @property {number} end - The end index of the token in the text.
 * @property {string} token - The token itself.
 */
export type TokenizerSpans = [
  start: number, // start index of the token
  end: number, // end index of the token
  token: string, // the token itself
]
