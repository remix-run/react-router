var expect = require('expect');
var NotFoundRoute = require('../NotFoundRoute');

describe('NotFoundRoute', function () {
  it('has a null path', function () {
    expect(NotFoundRoute({ path: '/' }).props.path).toBe(null);
  });
});
