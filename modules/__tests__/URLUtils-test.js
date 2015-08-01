import expect from 'expect';
import { getPathname, getQueryString, getParamNames } from '../URLUtils';

describe('getPathname', function () {
  it('returns the pathname portion of a path', function () {
    expect(getPathname('/a/b/c?id=def')).toEqual('/a/b/c');
  });
});

describe('getQueryString', function () {
  it('returns the query string portion of a path', function () {
    expect(getQueryString('/a/b/?id=def')).toEqual('id=def');
  });
});

describe('getParamNames', function () {
  describe('when a pattern contains no dynamic segments', function () {
    it('returns an empty array', function () {
      expect(getParamNames('a/b/c')).toEqual([]);
    });
  });

  describe('when a pattern contains :a and :b dynamic segments', function () {
    it('returns the correct names', function () {
      expect(getParamNames('/comments/:a/:b/edit')).toEqual([ 'a', 'b' ]);
    });
  });

  describe('when a pattern has a *', function () {
    it('uses the name "splat"', function () {
      expect(getParamNames('/files/*.jpg')).toEqual([ 'splat' ]);
    });
  });
});
