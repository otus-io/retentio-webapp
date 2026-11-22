import { Fragment } from 'react'
import { parseWikiRuby } from '@/utils/wiki-ruby'

/** Card text with `[[base|reading]]` ruby shown as a reading above its base. */
export default function RubyText({ text }: { text: string }) {
  return parseWikiRuby(text).map((segment, index) => (segment.kind === 'plain'
    ? <Fragment key={index}>{segment.text}</Fragment>
    : (
      <ruby key={index}>
        {segment.base}
        <rt>{segment.reading}</rt>
      </ruby>
    )))
}
