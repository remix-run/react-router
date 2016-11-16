import expect from 'expect'
import { formatPattern } from '../PatternUtils'

describe('formatPattern', function () {
  describe('when a pattern does not have dynamic segments', function () {
    const pattern = '/a/b/c'

    it('returns the pattern', function () {
      expect(formatPattern(pattern, {})).toEqual(pattern)
    })
  })

  describe('with a bad pattern', function () {
    describe('that is missing an end param', function () {
      const pattern = '/comments/(:id'

      describe('with no value given to the formatPattern function', function () {
        it('throws an error', function () {
          expect(function () {
            formatPattern(pattern, {})
          }).toThrow(/Path "\/comments\/\(:id" is missing end paren at segment ":id"/)
        })
      })

      describe('with value given to the formatPattern function', function () {
        it('throws an error', function () {
          expect(function () {
            formatPattern(pattern, { id: '1' })
          }).toThrow(/Path "\/comments\/\(:id" is missing end paren/)
        })
      })
    })
  })

  describe('when a pattern has dynamic segments', function () {
    const pattern = '/comments/:id/edit'

    describe('and a param is missing', function () {
      it('throws an Error', function () {
        expect(function () {
          formatPattern(pattern, {})
        }).toThrow(Error)
      })
    })

    describe('and a param is optional', function () {
      const pattern = '/comments/(:id)/edit'

      it('returns the correct path when param is supplied', function () {
        expect(formatPattern(pattern, { id:'123' })).toEqual('/comments/123/edit')
      })

      it('returns the correct path when param is not supplied', function () {
        expect(formatPattern(pattern, {})).toEqual('/comments/edit')
      })
    })

    describe('and a param and forward slash are optional', function () {
      const pattern = '/comments(/:id)/edit'

      it('returns the correct path when param is supplied', function () {
        expect(formatPattern(pattern, { id:'123' })).toEqual('/comments/123/edit')
      })

      it('returns the correct path when param is not supplied', function () {
        expect(formatPattern(pattern, {})).toEqual('/comments/edit')
      })
    })

    describe('and a param is optional with addtional text prior to the params', function () {
      const pattern = '/search(/forum/:id)'

      it('returns the correct path when param is supplied', function () {
        expect(formatPattern(pattern, { id:'123' })).toEqual('/search/forum/123')
      })

      it('returns the correct path when param is not supplied', function () {
        expect(formatPattern(pattern, { })).toEqual('/search')
      })
    })

    describe('and a param is optional with multiple segments and addtional text prior to the params', function () {
      const pattern = '/search(/forum/:forum_id)(/comment/:comment_id)'

      it('returns the correct path when param is supplied', function () {
        expect(formatPattern(pattern, { forum_id: '123', comment_id: '456' })).toEqual('/search/forum/123/comment/456')
      })

      it('returns the correct path when forum_id param is supplied', function () {
        expect(formatPattern(pattern, { forum_id: '123' })).toEqual('/search/forum/123')
      })

      it('returns the correct path when comment_id param is supplied', function () {
        expect(formatPattern(pattern, { comment_id: '456' })).toEqual('/search/comment/456')
      })

      it('returns the correct path when param is not supplied', function () {
        expect(formatPattern(pattern, { })).toEqual('/search')
      })
    })

    describe('and a param is optional with multiple segments in the optional part', function () {
      const pattern = '/search(/forum/:forum_id/comment/:comment_id)'

      it('returns the correct path when param is supplied', function () {
        expect(formatPattern(pattern, { forum_id:'123', comment_id: '456' })).toEqual('/search/forum/123/comment/456')
      })

      it('returns the correct path when forum_id param is not supplied', function () {
        expect(formatPattern(pattern, { forum_id:'123' })).toEqual('/search')
      })

      it('returns the correct path when comment_id param is not supplied 2', function () {
        expect(formatPattern(pattern, { comment_id:'456' })).toEqual('/search')
      })

      it('returns the correct path when param is not supplied', function () {
        expect(formatPattern(pattern, { })).toEqual('/search')
      })
    })

    describe('and a param is optional with nested optional segments with addtional text prior to the params', function () {
      const pattern = '/search(/forum/:forum_id(/comment/:comment_id))'

      it('returns the correct path when params are supplied', function () {
        expect(formatPattern(pattern, { forum_id:'123', comment_id: '456' })).toEqual('/search/forum/123/comment/456')
      })

      it('returns the correct path when forum_id param is supplied', function () {
        expect(formatPattern(pattern, { forum_id:'123' })).toEqual('/search/forum/123')
      })

      it('returns the correct path when comment_id param is supplied', function () {
        expect(formatPattern(pattern, { comment_id: '456' })).toEqual('/search')
      })

      it('returns the correct path when param is not supplied', function () {
        expect(formatPattern(pattern, { })).toEqual('/search')
      })
    })

    describe('and a param is optional with nested optional segments with addtional text prior to the params in different order', function () {
      const pattern = '/search((/forum/:forum_id)/comment/:comment_id)'

      it('returns the correct path when params are supplied', function () {
        expect(formatPattern(pattern, { forum_id:'123', comment_id: '456' })).toEqual('/search/forum/123/comment/456')
      })

      it('returns the correct path when comment_id param is supplied', function () {
        expect(formatPattern(pattern, { comment_id: '456' })).toEqual('/search/comment/456')
      })

      it('returns the correct path when forum_id param is supplied', function () {
        expect(formatPattern(pattern, { forum_id:'123' })).toEqual('/search')
      })

      it('returns the correct path when param is not supplied', function () {
        expect(formatPattern(pattern, { })).toEqual('/search')
      })
    })

    describe('and a param is parentheses escaped', function () {
      const pattern = '/comments\\(:id\\)'

      it('returns the correct path when param is supplied', function () {
        expect(formatPattern(pattern, { id:'123' })).toEqual('/comments(123)')
      })
    })

    describe('and a param is parentheses escaped with additional param', function () {
      const pattern = '/comments\\(:id\\)/:mode'

      it('returns the correct path when param is supplied', function () {
        expect(formatPattern(pattern, { id:'123', mode: 'edit' })).toEqual('/comments(123)/edit')
      })
    })

    describe('and all params are present', function () {
      it('returns the correct path', function () {
        expect(formatPattern(pattern, { id: 'abc' })).toEqual('/comments/abc/edit')
      })

      it('returns the correct path when the value is 0', function () {
        expect(formatPattern(pattern, { id: 0 })).toEqual('/comments/0/edit')
      })
    })

    describe('and some params have special URL encoding', function () {
      it('returns the correct path', function () {
        expect(formatPattern(pattern, { id: 'one, two' })).toEqual('/comments/one%2C%20two/edit')
      })
    })

    describe('and a param has a forward slash', function () {
      it('preserves the forward slash', function () {
        expect(formatPattern(pattern, { id: 'the/id' })).toEqual('/comments/the%2Fid/edit')
      })
    })

    describe('and some params contain dots', function () {
      it('returns the correct path', function () {
        expect(formatPattern(pattern, { id: 'alt.black.helicopter' })).toEqual('/comments/alt.black.helicopter/edit')
      })
    })

    describe('and some params contain special characters', function () {
      it('returns the correct path', function () {
        expect(formatPattern(pattern, { id: '?not=confused&with=query#string' })).toEqual('/comments/%3Fnot%3Dconfused%26with%3Dquery%23string/edit')
      })
    })
  })

  describe('when a pattern has one splat', function () {
    it('returns the correct path', function () {
      expect(formatPattern('/a/*/d', { splat: 'b/c' })).toEqual('/a/b/c/d')
    })
  })

  describe('when a pattern has multiple splats', function () {
    it('returns the correct path', function () {
      expect(formatPattern('/a/*/c/*', { splat: [ 'b', 'd' ] })).toEqual('/a/b/c/d')
    })

    it('complains if not given enough splat values', function () {
      expect(function () {
        formatPattern('/a/*/c/*', { splat: [ 'b' ] })
      }).toThrow(Error)
    })
  })

  describe('when a pattern has a greedy splat', function () {
    it('returns the correct path', function () {
      expect(formatPattern('/a/**/d', { splat: 'b/c/d' })).toEqual('/a/b/c/d/d')
      expect(formatPattern('/a/**/d/**', { splat: [ 'b/c/d', 'e' ] })).toEqual('/a/b/c/d/d/e')
    })

    it('complains if not given enough splat values', function () {
      expect(function () {
        formatPattern('/a/**/d/**', { splat: [ 'b/c/d' ] })
      }).toThrow(Error)
    })
  })

  describe('when a pattern has dots', function () {
    it('returns the correct path', function () {
      expect(formatPattern('/foo.bar.baz')).toEqual('/foo.bar.baz')
    })
  })
})
