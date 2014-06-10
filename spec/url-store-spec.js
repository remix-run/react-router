require('./helper');
var URLStore = require('../lib/stores/url-store');

describe('when a new path is pushed to the URL', function () {
  describe('with a leading slash', function () {
    beforeEach(function () {
      URLStore.push('/a/b/c');
    });

    it('has the correct path', function () {
      expect(URLStore.getCurrentPath()).toEqual('/a/b/c');
    });
  });

  describe('without a leading slash', function () {
    beforeEach(function () {
      URLStore.push('a/b/c');
    });

    it('has the correct path', function () {
      expect(URLStore.getCurrentPath()).toEqual('/a/b/c');
    });
  });
});
