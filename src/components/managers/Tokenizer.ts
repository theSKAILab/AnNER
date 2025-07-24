import type { TokenizerSpans } from "@/components/types/Tokenizer"

/**
 * Tokenizer Class
 * @description This class provides methods for tokenizing text into spans of tokens.
 * @property {RegExp} regex - The regular expression used for tokenization.
 */
abstract class Tokenizer {
  // Explanation of the regex used for tokenization:
  // First Part: [\w\-\'\"\[\]\(\)]+
  // This part matches any combination of word characters (letters, digits, and underscores), hyphens, single quotes, double quotes, square brackets, and parentheses.
  // The + sign means it will match one or more of these characters in a row.
  // Second Part: \$[\d\.\S]
  // This part matches a dollar sign $ followed by any digit, a period, or any non-whitespace character.
  // Third Part: \S
  // This part matches any single non-whitespace character.
  public static regex = /[\w\-\'\"\[\]\(\)]+|\$[\d\.\S]|\S/gm

  /**
   * Tokenize a given text into an array of tokens.
   * @description This method uses a regular expression to split the text into tokens based on the defined regex.
   * @param {string} text - The text to be tokenized.
   * @returns {string[]} An array of tokens extracted from the text.
   */
  public static tokenize(text: string): string[] {
    const tokens: RegExpMatchArray | null = text.match(new RegExp(this.regex, 'g'))
    return tokens ? tokens.map((token) => token.trim()) : []
  }

  /**
   * Tokenize a given text into spans of tokens.
   * @description This method tokenizes the text and returns an array of spans, each containing the start index, end index, and the token itself.
   * @param {string} text - The text to be tokenized.
   * @returns {TokenizerSpans[]} An array of spans representing the tokens in the text.
   */
  public static span_tokenize(text: string): TokenizerSpans[] {
    const tokens: string[] = this.tokenize(text)
    const spans: TokenizerSpans[] = []

    let startIndex = 0
    for (const token of tokens) {
      const start = text.indexOf(token, startIndex)
      const end = start + token.length
      spans.push([start, end, token])
      startIndex = end
    }
    return spans
  }
}

export default Tokenizer
