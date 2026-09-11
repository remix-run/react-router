import * as assert from '@remix-run/assert'
import { describe, it } from '@remix-run/test'

import { parsePattern } from '../route-pattern/parse.ts'
import { generateVariants } from './variant.ts'

describe('generateVariants', () => {

  it('expands pathname optionals into one variant per combination', () => {
    // Filter to a single protocol so the cartesian-product doubling doesn't
    // obscure what we're checking — pathname optional expansion.
    let pathnames = (source: string) =>
      generateVariants(parsePattern(source))
        .filter((v) => v.protocol === 'http')
        .map((v) => v.pathname.map((s) => s.key).join('/'))

    assert.deepEqual(pathnames('a.:b.c'), ['a.{:}.c'])
    assert.deepEqual(pathnames('a(:b)*c'), ['a{*}', 'a{:}{*}'])
    assert.deepEqual(pathnames('a(:b)c(*d)e'), ['ace', 'ac{*}e', 'a{:}ce', 'a{:}c{*}e'])
    assert.deepEqual(pathnames('a(:b(*c):d)e'), ['ae', 'a{:}{:}e', 'a{:}{*}{:}e'])
    assert.deepEqual(pathnames('a(:b(*c):d)e(*f)g'), [
      'aeg',
      'ae{*}g',
      'a{:}{:}eg',
      'a{:}{:}e{*}g',
      'a{:}{*}{:}eg',
      'a{:}{*}{:}e{*}g',
    ])
  })

  describe('pathname segments', () => {
    it('produces one segment per separator-delimited piece', () => {
      let [variant] = generateVariants(parsePattern('/users/:id/posts'))
      assert.deepEqual(
        variant.pathname.map((s) => ({ type: s.type, key: s.key })),
        [
          { type: 'static', key: 'users' },
          { type: 'variable', key: '{:}' },
          { type: 'static', key: 'posts' },
        ],
      )
    })

    it('absorbs separators into wildcard segments', () => {
      let [variant] = generateVariants(parsePattern('/files/*path/details'))
      assert.deepEqual(
        variant.pathname.map((s) => ({ type: s.type, key: s.key })),
        [
          { type: 'static', key: 'files' },
          { type: 'wildcard', key: '{*}/details' },
        ],
      )
    })

    it('compiles variable segments to a `[^/]+` regexp', () => {
      let [variant] = generateVariants(parsePattern('/users/:id'))
      let segment = variant.pathname[1]
      assert.equal(segment.type, 'variable')
      if (segment.type !== 'variable') return
      assert.equal(segment.regexp.source, '^([^/]+)$')
      assert.equal(segment.regexp.exec('42')?.[1], '42')
      assert.equal(segment.regexp.exec('42/extra'), null)
    })

    it('compiles wildcard segments to a `.*` regexp', () => {
      let [variant] = generateVariants(parsePattern('/files/*path'))
      let segment = variant.pathname[1]
      assert.equal(segment.type, 'wildcard')
      if (segment.type !== 'wildcard') return
      assert.equal(segment.regexp.source, '^(.*)$')
      assert.equal(segment.regexp.exec('docs/readme.md')?.[1], 'docs/readme.md')
    })
  })
})
