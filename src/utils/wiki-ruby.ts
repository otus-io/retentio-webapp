/** A run of card text: plain characters, or a base with its reading shown above it. */
export type WikiRubySegment = { kind: 'plain', text: string } | { kind: 'ruby', base: string, reading: string }

/** `[[base|reading]]`, as the mobile app stores ruby. Either side may be empty while it is being edited. */
const PAIR = /\[\[([^\]|]*)\|([^\]]*)\]\]/g

/**
 * Splits card text into plain runs and ruby pairs, matching the mobile app: a pair with an empty reading shows
 * its base as plain text, one with an empty base shows its reading, and `[[|]]` or an unclosed `[[` stays as is.
 */
export function parseWikiRuby(input: string): WikiRubySegment[] {
  const segments: WikiRubySegment[] = []
  const pushPlain = (text: string) => {
    if (!text) return
    const last = segments.at(-1)
    if (last?.kind === 'plain') last.text += text
    else segments.push({ kind: 'plain', text })
  }
  let index = 0
  for (const match of input.matchAll(PAIR)) {
    pushPlain(input.slice(index, match.index))
    const [whole, base, reading] = match
    if (base && reading) segments.push({ kind: 'ruby', base, reading })
    else pushPlain(base || reading || whole)
    index = match.index + whole.length
  }
  pushPlain(input.slice(index))
  return segments
}

/** Card text without ruby markup, e.g. for alt text. Readings are dropped where a base is shown. */
export function wikiRubyPlainText(input: string) {
  return parseWikiRuby(input).map((s) => (s.kind === 'plain' ? s.text : s.base)).join('')
}
