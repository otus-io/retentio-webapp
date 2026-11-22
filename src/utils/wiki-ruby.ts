/** A run of card text: plain characters, or a base with its reading shown above it. */
export type WikiRubySegment = { kind: 'plain', text: string } | { kind: 'ruby', base: string, reading: string }

/**
 * Splits `[[base|reading]]` ruby (as the mobile app stores it) from plain runs, matching the mobile app: a pair
 * with an empty reading shows its base as plain text, one with an empty base shows its reading, and `[[|]]` or an
 * unclosed `[[` stays as is.
 *
 * Same matches as /\[\[([^\]|]*)\|([^\]]*)\]\]/g (the base may hold `[` but stops at the first `]` or `|`, which
 * must be `|`; the reading may hold `[` and `|` and stops at the first `]`, which must start `]]`), but scanned in
 * linear time: that regex retries from every `[[` and goes quadratic on long unmatched runs.
 */
export function parseWikiRuby(input: string): WikiRubySegment[] {
  const segments: WikiRubySegment[] = []
  const pushPlain = (text: string) => {
    if (!text) return
    const last = segments.at(-1)
    if (last?.kind === 'plain') last.text += text
    else segments.push({ kind: 'plain', text })
  }
  const n = input.length
  // First `]` or `|`, and first `]`, at or after each index (n when none).
  const nextStop = new Int32Array(n + 1).fill(n)
  const nextClose = new Int32Array(n + 1).fill(n)
  for (let i = n - 1; i >= 0; i--) {
    nextClose[i] = input[i] === ']' ? i : nextClose[i + 1]
    nextStop[i] = input[i] === ']' || input[i] === '|' ? i : nextStop[i + 1]
  }
  let plainStart = 0
  let i = 0
  while (i < n - 1) {
    const bar = input[i] === '[' && input[i + 1] === '[' ? nextStop[i + 2] : n
    const close = input[bar] === '|' ? nextClose[bar + 1] : n
    if (input[close + 1] !== ']') {
      i += 1
      continue
    }
    pushPlain(input.slice(plainStart, i))
    const base = input.slice(i + 2, bar)
    const reading = input.slice(bar + 1, close)
    if (base && reading) segments.push({ kind: 'ruby', base, reading })
    else pushPlain(base || reading || input.slice(i, close + 2))
    i = plainStart = close + 2
  }
  pushPlain(input.slice(plainStart))
  return segments
}

/** Card text without ruby markup, e.g. for alt text. Readings are dropped where a base is shown. */
export function wikiRubyPlainText(input: string) {
  return parseWikiRuby(input).map((s) => (s.kind === 'plain' ? s.text : s.base)).join('')
}
