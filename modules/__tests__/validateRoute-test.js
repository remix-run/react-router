var expect = require('expect');
var validateRoute = require('../validateRoute');

describe('validateRoute', function () {
  describe('when a route does not have a handler/getHandler', function () {
    it('throws', function () {
      expect(function () {
        validateRoute({ path: '/home' });
      }).toThrow(Error);
    });
  });
});
