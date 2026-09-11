import * as assert from '@remix-run/assert'
import { describe, it } from '@remix-run/test'

import { createMultiMatcher } from './match.ts'

describe('Matcher', () => {
  describe('match', () => {

    describe('pathname', () => {
      it('matches root pathname when pathname is empty', () => {
        let matcher = createMultiMatcher<null>()
        matcher.add('://example.com', null)

        assert.ok(matcher.match('http://example.com/'))
      })

      it('matches static segments', () => {
        let matcher = createMultiMatcher<null>()
        matcher.add('://example.com/users/list', null)

        let match = matcher.match('http://example.com/users/list')
        assert.ok(match)
        assert.deepEqual(match.params, {})
      })

      it('returns null when static segment does not match', () => {
        let matcher = createMultiMatcher<null>()
        matcher.add('://example.com/users', null)

        assert.equal(matcher.match('http://example.com/posts'), null)
      })

      it('returns null when URL is shorter than pattern', () => {
        let matcher = createMultiMatcher<null>()
        matcher.add('://example.com/users/list', null)

        assert.equal(matcher.match('http://example.com/users'), null)
      })

      it('returns null when trailing slash does not match', () => {
        let matcher = createMultiMatcher<null>()
        matcher.add('://example.com/users', null)

        assert.equal(matcher.match('http://example.com/users/'), null)
      })

      it('matches variables', () => {
        let matcher = createMultiMatcher<null>()
        matcher.add('://example.com/users/:id', null)

        let match = matcher.match('http://example.com/users/123')
        assert.ok(match)
        assert.deepEqual(match.params, { id: '123' })
      })

      it('matches multiple variables', () => {
        let matcher = createMultiMatcher<null>()
        matcher.add('://example.com/users/:userId/posts/:postId', null)

        let match = matcher.match('http://example.com/users/42/posts/99')
        assert.ok(match)
        assert.deepEqual(match.params, { userId: '42', postId: '99' })
      })

      it('matches special characters in variable values', () => {
        let matcher = createMultiMatcher<null>()
        matcher.add('://example.com/files/:filename', null)

        let match = matcher.match('http://example.com/files/my-file_v2.txt')
        assert.ok(match)
        assert.deepEqual(match.params, { filename: 'my-file_v2.txt' })
      })

      it('does not partially match variables after a static suffix', () => {
        let matcher = createMultiMatcher<null>()
        matcher.add('://example.com/files/report-:format.pdf', null)

        assert.equal(matcher.match('http://example.com/files/report-json.pdf.backup'), null)
      })

      it('matches wildcards', () => {
        let matcher = createMultiMatcher<null>()
        matcher.add('://example.com/files/*path', null)

        let match = matcher.match('http://example.com/files/docs/readme.md')
        assert.ok(match)
        assert.deepEqual(match.params, { path: 'docs/readme.md' })
      })

      it('matches wildcard with continuation', () => {
        let matcher = createMultiMatcher<null>()
        matcher.add('://example.com/files/*path/status', null)

        let match = matcher.match('http://example.com/files/docs/api/status')
        assert.ok(match)
        assert.deepEqual(match.params, { path: 'docs/api' })
      })

      it('does not partially match wildcards before a static suffix', () => {
        let matcher = createMultiMatcher<null>()
        matcher.add('://example.com/files/*path/status', null)

        assert.equal(matcher.match('http://example.com/files/docs/status/extra'), null)
      })

      it('excludes unnamed wildcard from params', () => {
        let matcher = createMultiMatcher<null>()
        matcher.add('://example.com/files/*/download', null)

        let match = matcher.match('http://example.com/files/docs/download')
        assert.ok(match)
        assert.deepEqual(match.params, {})
      })

      it('matches optional segments when present', () => {
        let matcher = createMultiMatcher<null>()
        matcher.add('://example.com/posts(/:lang)', null)

        let match = matcher.match('http://example.com/posts/en')
        assert.ok(match)
        assert.deepEqual(match.params, { lang: 'en' })
      })

      it('matches optional segments when absent', () => {
        let matcher = createMultiMatcher<null>()
        matcher.add('://example.com/posts(/:lang)', null)

        let match = matcher.match('http://example.com/posts')
        assert.ok(match)
        assert.deepEqual(match.params, { lang: undefined })
      })

      it('matches nested optionals', () => {
        let matcher = createMultiMatcher<null>()
        matcher.add('://example.com/docs(/:version(/:page))', null)

        let match1 = matcher.match('http://example.com/docs/v1/intro')
        assert.ok(match1)
        assert.deepEqual(match1.params, { version: 'v1', page: 'intro' })

        let match2 = matcher.match('http://example.com/docs/v1')
        assert.ok(match2)
        assert.deepEqual(match2.params, { version: 'v1', page: undefined })

        let match3 = matcher.match('http://example.com/docs')
        assert.ok(match3)
        assert.deepEqual(match3.params, { version: undefined, page: undefined })
      })

      it('matches multiple optionals', () => {
        let matcher = createMultiMatcher<null>()
        matcher.add('://example.com/api(/:version)/users(/:id)', null)

        let match = matcher.match('http://example.com/api/v2/users/123')
        assert.ok(match)
        assert.deepEqual(match.params, { version: 'v2', id: '123' })
      })

      it('matches complex optionals for file extensions', () => {
        let matcher = createMultiMatcher<null>()
        matcher.add('://example.com/files/:id(.:format)', null)

        let match1 = matcher.match('http://example.com/files/doc123.pdf')
        assert.ok(match1)
        assert.deepEqual(match1.params, { id: 'doc123', format: 'pdf' })

        let match2 = matcher.match('http://example.com/files/doc123')
        assert.ok(match2)
        assert.deepEqual(match2.params, { id: 'doc123', format: undefined })
      })

      it('matches mixed static/variable/wildcards', () => {
        let matcher = createMultiMatcher<null>()
        matcher.add('://example.com/api/:version/files/*path', null)

        let match = matcher.match('http://example.com/api/v1/files/docs/guide.pdf')
        assert.ok(match)
        assert.deepEqual(match.params, { version: 'v1', path: 'docs/guide.pdf' })
      })

      it('matches deep nesting', () => {
        let matcher = createMultiMatcher<null>()
        matcher.add(
          '://example.com/products/electronics/computers/laptops/gaming/accessories/keyboards',
          null,
        )

        let match = matcher.match(
          'http://example.com/products/electronics/computers/laptops/gaming/accessories/keyboards',
        )
        assert.ok(match)
        assert.deepEqual(match.params, {})
      })

      it('prefers static over variable pathname', () => {
        let matcher = createMultiMatcher<null>()
        matcher.add('://example.com/users/new', null)
        matcher.add('://example.com/users/:id', null)

        let match = matcher.match('http://example.com/users/new')
        assert.ok(match)
        assert.equal(match.pattern.toString(), '://example.com/users/new')
      })

      it('prefers variable over wildcard pathname', () => {
        let matcher = createMultiMatcher<null>()
        matcher.add('://example.com/files/*path', null)
        matcher.add('://example.com/files/:id', null)

        let match = matcher.match('http://example.com/files/123')
        assert.ok(match)
        assert.equal(match.pattern.toString(), '://example.com/files/:id')
      })

      it('prefers longer static prefix in pathname', () => {
        let matcher = createMultiMatcher<null>()
        matcher.add('://example.com/api/:id', null)
        matcher.add('://example.com/api/v1/:id', null)

        let match = matcher.match('http://example.com/api/v1/users')
        assert.ok(match)
        assert.equal(match.pattern.toString(), '://example.com/api/v1/:id')
      })
    })

    describe('ignoreCase', () => {
      it('uses case-sensitive pathname matching by default', () => {
        let matcher = createMultiMatcher<null>()
        matcher.add('/Posts/:id', null)

        assert.equal(matcher.match('https://example.com/posts/123'), null)
        assert.equal(matcher.match('https://example.com/POSTS/123'), null)
        assert.ok(matcher.match('https://example.com/Posts/123'))
      })

      it('ignores pathname case when ignoreCase is true', () => {
        let matcher = createMultiMatcher<null>({ ignoreCase: true })
        matcher.add('/Posts/:id', null)

        assert.ok(matcher.match('https://example.com/posts/123'))
        assert.ok(matcher.match('https://example.com/POSTS/123'))
        assert.ok(matcher.match('https://example.com/Posts/123'))
      })

      it('defaults to false', () => {
        let matcher = createMultiMatcher<null>()
        matcher.add('/Posts/:id', null)
        assert.equal(matcher.match('https://example.com/posts/123'), null)
      })
    })

    describe('escaping', () => {

      describe('pathname', () => {
        it('matches escaped special chars in static text', () => {
          let matcher = createMultiMatcher<null>()
          matcher.add('/a\\:b/c\\*d/e\\(f\\)/g\\\\h', null)

          let match = matcher.match('https://example.com/a%3Ab/c*d/e(f)/g%5Ch')
          assert.ok(match)
          assert.deepEqual(match.params, {})
        })
      })
    })

    describe('codec', () => {
      // Unlike pathname params, hostname labels can't use the emoji, zwj,
      // nbsp, or fullwidth cases; see:
      // https://unicode.org/reports/tr46/#Validity_Criteria
      let hostnameCodec = [
        'café', // accented
        '北京-とうきょう-서울', // cjk
        /* rtl */ 'مرحبا-עולם',
        'Hà-Nội', // combining
      ]

      describe('pathname', () => {
        let pathnameCodec = [
          ...hostnameCodec,
          '💿', // emoji
          '🧑‍🚀', // zwj (🚀 + zero-width joiner + 👨)
          'acme\u00A0corp', // nbsp
          'ｗｉｄｅ', // fullwidth
        ]

        it('matches percent-encoded Unicode static segments', () => {
          for (let value of pathnameCodec) {
            let matcher = createMultiMatcher<null>()
            matcher.add(`://example.com/${value}`, null)

            let url = new URL(`https://example.com/${value}`)
            let match = matcher.match(url.href)
            assert.deepEqual(match?.params, {})
          }
        })

        it('decodes percent-encoded Unicode variables', () => {
          for (let value of pathnameCodec) {
            let matcher = createMultiMatcher<null>()
            matcher.add('://example.com/:value', null)

            let url = new URL(`https://example.com/${value}`)
            let match = matcher.match(url.href)
            assert.deepEqual(match?.params, { value })
          }
        })

        it('decodes percent-encoded Unicode wildcards', () => {
          for (let value of pathnameCodec) {
            let matcher = createMultiMatcher<null>()
            matcher.add('://example.com/files/*path', null)

            let url = new URL(`https://example.com/files/${value}`)
            let match = matcher.match(url.href)
            assert.deepEqual(match?.params, { path: value })
          }
        })

        it('normalizes percent-encoded ASCII in static segments', () => {
          let matcher = createMultiMatcher<null>()
          matcher.add('://example.com/a', null)

          let match = matcher.match('https://example.com/%61')
          assert.deepEqual(match?.params, {})
        })

        it('treats raw and percent-encoded URL path-safe static text as equivalent', () => {
          let matcher = createMultiMatcher<null>()
          matcher.add('/packages/@scope+name,semi;equals=/file', null)

          assert.deepEqual(
            matcher.match('https://example.com/packages/@scope+name,semi;equals=/file')?.params,
            {},
          )
          assert.deepEqual(
            matcher.match('https://example.com/packages/%40scope%2Bname%2Csemi%3Bequals%3D/file')
              ?.params,
            {},
          )
        })

        it('decodes percent-encoded ASCII in variables', () => {
          let matcher = createMultiMatcher<null>()
          matcher.add('://example.com/:value', null)

          let match = matcher.match('https://example.com/%61')
          assert.deepEqual(match?.params, { value: 'a' })
        })

        it('decodes percent-encoded ASCII in wildcards', () => {
          let matcher = createMultiMatcher<null>()
          matcher.add('://example.com/files/*path', null)

          let match = matcher.match('https://example.com/files/%61')
          assert.deepEqual(match?.params, { path: 'a' })
        })

        it('returns null for malformed percent-encoded pathnames', () => {
          let matcher = createMultiMatcher<null>()
          matcher.add('://example.com/files/:name', null)

          assert.equal(matcher.match('https://example.com/files/%E0%A4%A'), null)
          assert.equal(matcher.match('https://example.com/files/%'), null)
        })

        it('returns no matches for malformed percent-encoded pathnames', () => {
          let matcher = createMultiMatcher<null>()
          matcher.add('://example.com/files/:name', null)
          matcher.add('://example.com/files/*path', null)

          assert.deepEqual(matcher.matchAll('https://example.com/files/%E0%A4%A'), [])
        })

        it('does not match encoded slashes as pathname separators', () => {
          let matcher = createMultiMatcher<null>()
          matcher.add('://example.com/files/:dir/:name', null)

          assert.equal(matcher.match('http://example.com/files/docs%2Freadme.md'), null)
        })

        it('decodes encoded slashes in variables', () => {
          let matcher = createMultiMatcher<null>()
          matcher.add('://example.com/files/:name', null)

          let match = matcher.match('https://example.com/files/docs%2Freadme.md')
          assert.deepEqual(match?.params, { name: 'docs/readme.md' })
        })

        it('decodes encoded slashes in wildcards with continuation', () => {
          let matcher = createMultiMatcher<null>()
          matcher.add('://example.com/files/*path/status', null)

          let match = matcher.match('https://example.com/files/docs%2Freadme.md/status')
          assert.deepEqual(match?.params, { path: 'docs/readme.md' })
        })

        it('decodes structural slashes in wildcards with continuation', () => {
          let matcher = createMultiMatcher<null>()
          matcher.add('://example.com/files/*path/status', null)

          let match = matcher.match('https://example.com/files/docs/readme.md/status')
          assert.deepEqual(match?.params, { path: 'docs/readme.md' })
        })
      })
    })

    describe('paramsMeta', () => {
      it('returns empty arrays when no params', () => {
        let matcher = createMultiMatcher<null>()
        matcher.add('://example.com/users', null)

        let match = matcher.match('http://example.com/users')
        assert.ok(match)
        assert.deepEqual(match.paramsMeta.hostname, [])
        assert.deepEqual(match.paramsMeta.pathname, [])
      })

      it('includes pathname params with metadata', () => {
        let matcher = createMultiMatcher<null>()
        matcher.add('://example.com/users/:id', null)

        let match = matcher.match('http://example.com/users/123')
        assert.ok(match)
        assert.deepEqual(match.paramsMeta.hostname, [])
        assert.equal(match.paramsMeta.pathname.length, 1)
        assert.equal(match.paramsMeta.pathname[0].name, 'id')
        assert.equal(match.paramsMeta.pathname[0].type, ':')
        assert.equal(match.paramsMeta.pathname[0].value, '123')
      })

      it('includes wildcard params in metadata', () => {
        let matcher = createMultiMatcher<null>()
        matcher.add('://example.com/files/*path', null)

        let match = matcher.match('http://example.com/files/docs/readme.md')
        assert.ok(match)
        assert.equal(match.paramsMeta.pathname.length, 1)
        assert.equal(match.paramsMeta.pathname[0].name, 'path')
        assert.equal(match.paramsMeta.pathname[0].type, '*')
        assert.equal(match.paramsMeta.pathname[0].value, 'docs/readme.md')
      })

      it('includes unnamed wildcards in metadata with name "*"', () => {
        let matcher = createMultiMatcher<null>()
        matcher.add('://example.com/files/*/download', null)

        let match = matcher.match('http://example.com/files/docs/download')
        assert.ok(match)
        assert.equal(match.paramsMeta.pathname.length, 1)
        assert.equal(match.paramsMeta.pathname[0].name, '*')
        assert.equal(match.paramsMeta.pathname[0].type, '*')
        assert.equal(match.paramsMeta.pathname[0].value, 'docs')
      })

      it('excludes undefined optional params from metadata', () => {
        let matcher = createMultiMatcher<null>()
        matcher.add('://example.com/posts(/:lang)', null)

        let match = matcher.match('http://example.com/posts')
        assert.ok(match)
        assert.deepEqual(match.paramsMeta.pathname, [])
      })

      it('includes only matched optional params in metadata', () => {
        let matcher = createMultiMatcher<null>()
        matcher.add('://example.com/docs(/:version(/:page))', null)

        let match = matcher.match('http://example.com/docs/v1')
        assert.ok(match)
        assert.equal(match.paramsMeta.pathname.length, 1)
        assert.equal(match.paramsMeta.pathname[0].name, 'version')
        assert.equal(match.paramsMeta.pathname[0].value, 'v1')
      })
    })

    describe('specificity', () => {
      it('prefers static over variable', () => {
        let matcher = createMultiMatcher<null>()
        matcher.add('://example.com/:segment', null)
        matcher.add('://example.com/users', null)

        let match = matcher.match('http://example.com/users')
        assert.ok(match)
        assert.equal(match.pattern.toString(), '://example.com/users')
      })

      it('prefers variable over wildcard', () => {
        let matcher = createMultiMatcher<null>()
        matcher.add('://example.com/*path', null)
        matcher.add('://example.com/:id', null)

        let match = matcher.match('http://example.com/123')
        assert.ok(match)
        assert.equal(match.pattern.toString(), '://example.com/:id')
      })

      it('prefers longer static prefix over shorter', () => {
        let matcher = createMultiMatcher<null>()
        matcher.add('://example.com/:id', null)
        matcher.add('://example.com/api/:id', null)

        let match = matcher.match('http://example.com/api/users')
        assert.ok(match)
        assert.equal(match.pattern.toString(), '://example.com/api/:id')
      })

      it('returns null when no patterns match', () => {
        let matcher = createMultiMatcher<null>()
        matcher.add('://example.com/users', null)
        matcher.add('://example.com/posts', null)

        assert.equal(matcher.match('http://example.com/comments'), null)
      })
    })
  })

  describe('matchAll', () => {
    it('returns all matches sorted by specificity', () => {
      let matcher = createMultiMatcher<null>()
      matcher.add('://example.com/*path', null)
      matcher.add('://example.com/users/:id', null)
      matcher.add('://example.com/users/new', null)

      let matches = matcher.matchAll('http://example.com/users/new')
      assert.deepEqual(
        matches.map((m) => m.pattern.toString()),
        ['://example.com/users/new', '://example.com/users/:id', '://example.com/*path'],
      )
    })

    it('returns empty array when no matches', () => {
      let matcher = createMultiMatcher<null>()
      matcher.add('://example.com/users', null)
      matcher.add('://example.com/posts', null)

      let matches = matcher.matchAll('http://example.com/comments')
      assert.deepEqual(matches, [])
    })

    it('includes patterns with same specificity', () => {
      let matcher = createMultiMatcher<null>()
      matcher.add('://example.com/users/:id', null)
      matcher.add('://example.com/posts/:id', null)

      let matches = matcher.matchAll('http://example.com/users/123')
      assert.deepEqual(
        matches.map((m) => m.pattern.toString()),
        ['://example.com/users/:id'],
      )

      let matches2 = matcher.matchAll('http://example.com/posts/456')
      assert.deepEqual(
        matches2.map((m) => m.pattern.toString()),
        ['://example.com/posts/:id'],
      )
    })
  })
})
