var assert = require('assert');
var expect = require('expect');
var LocationActions = require('../../actions/LocationActions');
var LocationDispatcher = require('../../dispatchers/LocationDispatcher');
var PathStore = require('../PathStore');

describe('PathStore', function () {
  beforeEach(function () {
    LocationDispatcher.handleViewAction({
      type: LocationActions.PUSH,
      path: '/'
    });
  });

  var changeWasFired;
  function changeListener() {
    changeWasFired = true;
  }

  function setupChangeListener() {
    changeWasFired = false;
    PathStore.addChangeListener(changeListener);
  }

  function teardownChangeListener() {
    PathStore.removeChangeListener(changeListener);
  }

  describe('when a new URL path is pushed', function () {
    beforeEach(setupChangeListener);
    beforeEach(function () {
      LocationDispatcher.handleViewAction({
        type: LocationActions.PUSH,
        path: '/push'
      });
    });

    afterEach(teardownChangeListener);

    it('updates the path', function () {
      expect(PathStore.getCurrentPath()).toEqual('/push');
    });

    it('updates the action type', function () {
      expect(PathStore.getCurrentActionType()).toEqual(LocationActions.PUSH);
    });

    it('emits a change event', function () {
      assert(changeWasFired);
    });
  });

  describe('when a URL path is replaced', function () {
    beforeEach(setupChangeListener);
    beforeEach(function () {
      LocationDispatcher.handleViewAction({
        type: LocationActions.REPLACE,
        path: '/replace'
      });
    });

    afterEach(teardownChangeListener);

    it('updates the path', function () {
      expect(PathStore.getCurrentPath()).toEqual('/replace');
    });

    it('updates the action type', function () {
      expect(PathStore.getCurrentActionType()).toEqual(LocationActions.REPLACE);
    });

    it('emits a change event', function () {
      assert(changeWasFired);
    });
  });

  describe('when a URL path is popped', function () {
    beforeEach(setupChangeListener);
    beforeEach(function () {
      LocationDispatcher.handleViewAction({
        type: LocationActions.POP,
        path: '/pop'
      });
    });

    afterEach(teardownChangeListener);

    it('updates the path', function () {
      expect(PathStore.getCurrentPath()).toEqual('/pop');
    });

    it('updates the action type', function () {
      expect(PathStore.getCurrentActionType()).toEqual(LocationActions.POP);
    });

    it('emits a change event', function () {
      assert(changeWasFired);
    });
  });
});
