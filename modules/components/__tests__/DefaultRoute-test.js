var expect = require('expect');
var DefaultRoute = require('../DefaultRoute');

describe('DefaultRoute', function () {
  it('has a null path', function () {
    expect(DefaultRoute({ path: '/' }).props.path).toBe(null);
  });
});
