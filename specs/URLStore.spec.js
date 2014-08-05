require('./helper');
var URLStore = require('../modules/stores/URLStore');

describe('URLStore', function() {

  beforeEach(function() {
    URLStore.setup("hash");
  });

  afterEach(function() {
    URLStore.teardown();
  });

  describe('when a new path is pushed to the URL', function() {
    beforeEach(function() {
      URLStore.push('/a/b/c');
    });

    it('has the correct path', function() {
      expect(URLStore.getCurrentPath()).toEqual('/a/b/c');
    });
  });

  describe('when a new path is used to replace the URL', function() {
    beforeEach(function() {
      URLStore.replace('/a/b/c');
    });

    it('has the correct path', function() {
      expect(URLStore.getCurrentPath()).toEqual('/a/b/c');
    });
  });

  describe('when going back in history', function() {
    it('has the correct path', function() {
      URLStore.push('/a/b/c');
      expect(URLStore.getCurrentPath()).toEqual('/a/b/c');

      URLStore.push('/d/e/f');
      expect(URLStore.getCurrentPath()).toEqual('/d/e/f');

      URLStore.back();
      expect(URLStore.getCurrentPath()).toEqual('/a/b/c');
    });
  });

  describe('when navigating back to the root', function() {
    beforeEach(function() {
      URLStore.teardown();

      // simulating that the browser opens a page with #/dashboard
      window.location.hash = '/dashboard';
      URLStore.setup('hash');
    });

    it('should have the correct path', function() {
      URLStore.push('/');
      expect(window.location.hash).toEqual('#/');
    });
  });

  describe('when using history location handler', function() {
    itShouldManagePathsForLocation('history');
  });

  describe('when using memory location handler', function() {
    itShouldManagePathsForLocation('memory');
  });

  function itShouldManagePathsForLocation(location) {
    var origPath;

    beforeEach(function() {
      URLStore.teardown();
      URLStore.setup(location);
      origPath = URLStore.getCurrentPath();
    });

    afterEach(function() {
      URLStore.push(origPath);
      expect(URLStore.getCurrentPath()).toEqual(origPath);
    });

    it('should manage the path correctly', function() {
      URLStore.push('/test');
      expect(URLStore.getCurrentPath()).toEqual('/test');

      URLStore.push('/test/123');
      expect(URLStore.getCurrentPath()).toEqual('/test/123');

      URLStore.replace('/test/replaced');
      expect(URLStore.getCurrentPath()).toEqual('/test/replaced');

      URLStore.back();
      expect(URLStore.getCurrentPath()).toEqual('/test');

    });
  }

});

