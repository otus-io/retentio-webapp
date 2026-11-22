import { describe, expect, it } from 'vitest'
import { parseWikiRuby, wikiRubyPlainText } from '@/utils/wiki-ruby'

describe('parseWikiRuby', () => {
  it('splits text into plain runs and ruby pairs', () => {
    expect(parseWikiRuby('私は[[日本語|にほんご]]を[[勉強|べんきょう]]する')).toEqual([
      { kind: 'plain', text: '私は' },
      { kind: 'ruby', base: '日本語', reading: 'にほんご' },
      { kind: 'plain', text: 'を' },
      { kind: 'ruby', base: '勉強', reading: 'べんきょう' },
      { kind: 'plain', text: 'する' },
    ])
  })

  it('shows half-edited pairs as plain text, like the mobile app', () => {
    expect(parseWikiRuby('[[見|]]る')).toEqual([{ kind: 'plain', text: '見る' }])
    expect(parseWikiRuby('[[|み]]る')).toEqual([{ kind: 'plain', text: 'みる' }])
    expect(parseWikiRuby('a[[|]]b')).toEqual([{ kind: 'plain', text: 'a[[|]]b' }])
  })

  it('leaves text without complete pairs alone', () => {
    expect(parseWikiRuby('[[漢字 と [x] | y')).toEqual([{ kind: 'plain', text: '[[漢字 と [x] | y' }])
    expect(parseWikiRuby('')).toEqual([])
  })
})

describe('wikiRubyPlainText', () => {
  it('drops the markup and readings', () => {
    expect(wikiRubyPlainText('[[日本|にほん]]へ[[|み]]')).toBe('日本へみ')
  })
})
