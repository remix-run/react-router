import expect from 'expect';
import { getPathname, getQueryString } from '../URLUtils';

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

describe('matchPattern', function () {
  it('ignores trailing slashes');
});
