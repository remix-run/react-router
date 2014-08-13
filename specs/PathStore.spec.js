require('./helper');
var MemoryLocation = require('../modules/locations/MemoryLocation');
var PathStore = require('../modules/stores/PathStore');

describe('PathStore', function () {

  beforeEach(function () {
    PathStore.setup(MemoryLocation);
    PathStore.push('/one');
  });

  afterEach(function () {
    PathStore.teardown();
  });

  describe('when a new path is pushed to the URL', function () {
    beforeEach(function () {
      PathStore.push('/two');
    });

    it('has the correct path', function () {
      expect(PathStore.getCurrentPath()).toEqual('/two');
    });
  });

  describe('when a new path is used to replace the URL', function () {
    beforeEach(function () {
      PathStore.push('/two');
      PathStore.replace('/three');
    });

    it('has the correct path', function () {
      expect(PathStore.getCurrentPath()).toEqual('/three');
    });

    describe('going back in history', function () {
      beforeEach(function () {
        PathStore.pop();
      });

      it('has the path before the one that was replaced', function () {
        expect(PathStore.getCurrentPath()).toEqual('/one');
      });
    });
  });

  describe('when going back in history', function () {
    beforeEach(function () {
      PathStore.push('/two');
      PathStore.pop();
    });

    it('has the correct path', function () {
      expect(PathStore.getCurrentPath()).toEqual('/one');
    });
  });

});
