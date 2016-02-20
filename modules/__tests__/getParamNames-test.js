import expect from 'expect'
import { getParamNames } from '../PatternUtils'

describe('getParamNames', function () {
  describe('when a pattern contains no dynamic segments', function () {
    it('returns an empty array', function () {
      expect(getParamNames('a/b/c')).toEqual([])
    })
  })

  describe('when a pattern contains :a and :b dynamic segments', function () {
    it('returns the correct names', function () {
      expect(getParamNames('/comments/:a/:b/edit')).toEqual([ 'a', 'b' ])
    })
  })

  describe('when a pattern has a *', function () {
    it('uses an anonymous name', function () {
      expect(getParamNames('/files/*.jpg')).toEqual([ 0 ])
    })
  })
})
