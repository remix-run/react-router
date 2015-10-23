import expect from 'expect'
import { getParams } from '../PatternUtils'

describe('getParams', function () {
  describe('when a pattern does not have dynamic segments', function () {
    const pattern = '/a/b/c'

    describe('and the path matches', function () {
      it('returns an empty object', function () {
        expect(getParams(pattern, pattern)).toEqual({})
      })
    })

    describe('and the path does not match', function () {
      it('returns null', function () {
        expect(getParams(pattern, '/d/e/f')).toBe(null)
      })
    })
  })

  describe('when a pattern has dynamic segments', function () {
    const pattern = '/comments/:id.:ext/edit'

    describe('and the path matches', function () {
      it('returns an object with the params', function () {
        expect(getParams(pattern, '/comments/abc.js/edit')).toEqual({ id: 'abc', ext: 'js' })
      })
    })

    describe('and the pattern is optional', function () {
      const pattern = '/comments/(:id)/edit'

      describe('and the path matches with supplied param', function () {
        it('returns an object with the params', function () {
          expect(getParams(pattern, '/comments/123/edit')).toEqual({ id: '123' })
        })
      })

      describe('and the path matches without supplied param', function () {
        it('returns an object with an undefined param', function () {
          expect(getParams(pattern, '/comments//edit')).toEqual({ id: undefined })
        })
      })
    })

    describe('and the pattern and forward slash are optional', function () {
      const pattern = '/comments(/:id)/edit'

      describe('and the path matches with supplied param', function () {
        it('returns an object with the params', function () {
          expect(getParams(pattern, '/comments/123/edit')).toEqual({ id: '123' })
        })
      })

      describe('and the path matches without supplied param', function () {
        it('returns an object with an undefined param', function () {
          expect(getParams(pattern, '/comments/edit')).toEqual({ id: undefined })
        })
      })
    })

    describe('and the path does not match', function () {
      it('returns null', function () {
        expect(getParams(pattern, '/users/123')).toBe(null)
      })
    })

    describe('and the path matches with a segment containing a .', function () {
      it('returns an object with the params', function () {
        expect(getParams(pattern, '/comments/foo.bar/edit')).toEqual({ id: 'foo', ext: 'bar' })
      })
    })
  })

  describe('when a pattern has characters that have special URL encoding', function () {
    const pattern = '/one, two'

    describe('and the path matches', function () {
      it('returns an empty object', function () {
        expect(getParams(pattern, '/one, two')).toEqual({})
      })
    })

    describe('and the path does not match', function () {
      it('returns null', function () {
        expect(getParams(pattern, '/one two')).toBe(null)
      })
    })
  })

  describe('when a pattern has dynamic segments and characters that have special URL encoding', function () {
    const pattern = '/comments/:id/edit now'

    describe('and the path matches', function () {
      it('returns an object with the params', function () {
        expect(getParams(pattern, '/comments/abc/edit now')).toEqual({ id: 'abc' })
      })
    })

    describe('and the path does not match', function () {
      it('returns null', function () {
        expect(getParams(pattern, '/users/123')).toBe(null)
      })
    })

    describe('and the path contains multiple special URL encoded characters', function () {
        const pattern = '/foo/:component'

        describe('and the path matches', function () {
            it('returns the correctly decoded characters', function () {
                expect(getParams(pattern, '/foo/%7Bfoo%24bar')).toEqual({ component: '{foo$bar' })
            })
        })
    })
  })

  describe('when a pattern has a *', function () {
    describe('and the path matches', function () {
      it('returns an object with the params', function () {
        expect(getParams('/files/*', '/files/my/photo.jpg')).toEqual({ splat: 'my/photo.jpg' })
        expect(getParams('/files/*', '/files/my/photo.jpg.zip')).toEqual({ splat: 'my/photo.jpg.zip' })
        expect(getParams('/files/*.jpg', '/files/my/photo.jpg')).toEqual({ splat: 'my/photo' })
        expect(getParams('/files/*.jpg', '/files/my/new\nline.jpg')).toEqual({ splat: 'my/new\nline' })
      })
    })

    describe('and the path does not match', function () {
      it('returns null', function () {
        expect(getParams('/files/*.jpg', '/files/my/photo.png')).toBe(null)
      })
    })
  })

  describe('when a pattern has an optional group', function () {
    const pattern = '/archive(/:name)'

    describe('and the path matches', function () {
      it('returns an object with the params', function () {
        expect(getParams(pattern, '/archive/foo')).toEqual({ name: 'foo' })
        expect(getParams(pattern, '/archive')).toEqual({ name: undefined })
      })
    })

    describe('and the path does not match', function () {
      it('returns null', function () {
        expect(getParams(pattern, '/archiv')).toBe(null)
      })
    })
  })

  describe('when a param has dots', function () {
    const pattern = '/:query/with/:domain'

    describe('and the path matches', function () {
      it('returns an object with the params', function () {
        expect(getParams(pattern, '/foo/with/foo.app')).toEqual({ query: 'foo', domain: 'foo.app' })
        expect(getParams(pattern, '/foo.ap/with/foo')).toEqual({ query: 'foo.ap', domain: 'foo' })
        expect(getParams(pattern, '/foo.ap/with/foo.app')).toEqual({ query: 'foo.ap', domain: 'foo.app' })
      })
    })

    describe('and the path does not match', function () {
      it('returns null', function () {
        expect(getParams(pattern, '/foo.ap')).toBe(null)
      })
    })
  })
})
