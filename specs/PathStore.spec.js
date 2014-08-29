require('./helper');
var transitionTo = require('../modules/actions/LocationActions').transitionTo;
var replaceWith = require('../modules/actions/LocationActions').replaceWith;
var goBack = require('../modules/actions/LocationActions').goBack;
var getCurrentPath = require('../modules/stores/PathStore').getCurrentPath;

describe('PathStore', function () {

  beforeEach(function () {
    transitionTo('/one');
  });

  describe('when a new path is pushed to the URL', function () {
    beforeEach(function () {
      transitionTo('/two');
    });

    it('has the correct path', function () {
      expect(getCurrentPath()).toEqual('/two');
    });
  });

  describe('when a new path is used to replace the URL', function () {
    beforeEach(function () {
      transitionTo('/two');
      replaceWith('/three');
    });

    it('has the correct path', function () {
      expect(getCurrentPath()).toEqual('/three');
    });

    describe('going back in history', function () {
      beforeEach(function () {
        goBack();
      });

      it('has the path before the one that was replaced', function () {
        expect(getCurrentPath()).toEqual('/one');
      });
    });
  });

  describe('when going back in history', function () {
    beforeEach(function () {
      transitionTo('/two');
      goBack();
    });

    it('has the correct path', function () {
      expect(getCurrentPath()).toEqual('/one');
    });
  });

});
