require('./helper');
var Link = require('../lib/components/link');

describe("when a Link's path matches the URL", function () {
  describe('and it has no query', function () {
    it('is active', function () {
      assert(Link.isActive('a/b/c', 'a/:id/c', { id: 'b' }));
    });
  });

  describe('and it has a query that matches', function () {
    it('is active', function () {
      assert(Link.isActive('a/b/c?show=true', 'a/:id/c', { id: 'b' }, { show: true }));
    });
  });

  describe('and it has a query that does not match', function () {
    it('is not active', function () {
      refute(Link.isActive('a/b/c?show=true', 'a/b/c', {}, { show: false }));
    });
  });
});
