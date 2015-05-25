var expect = require('expect');
var describeHistory = require('./describeHistory');
var History = require('../History');

describe.skip('History', function () {
  describeHistory(new History('/'));

  var history
  beforeEach(function () {
    history = new History('/');
  });

  describe('when first created', function () {
    it('has length 1', function () {
      expect(history.length).toEqual(1);
    });

    it('cannot go back', function () {
      expect(history.canGoBack()).toBe(false);
    });

    it('cannot go forward', function () {
      expect(history.canGoForward()).toBe(false);
    });
  });

  describe('when pushing a new path', function () {
    beforeEach(function () {
      history.push('/push');
    });

    it('increments length by one', function () {
      expect(history.length).toEqual(2);
    });

    it('increments current index by one', function () {
      expect(history.current).toEqual(1);
    });

    it('has the correct path', function () {
      expect(history.getPath()).toEqual('/push');
    });

    it('can go back', function () {
      expect(history.canGoBack()).toBe(true);
    });

    it('cannot go forward', function () {
      expect(history.canGoForward()).toBe(false);
    });
 
    describe('and then replacing that path', function () {
      beforeEach(function () {
        history.replace('/replace');
      });

      it('maintains the length', function () {
        expect(history.length).toEqual(2);
      });
  
      it('maintains the current index', function () {
        expect(history.current).toEqual(1);
      });

      it('returns the correct path', function () {
        expect(history.getPath()).toEqual('/replace');
      });

      it('can go back', function () {
        expect(history.canGoBack()).toBe(true);
      });

      it('cannot go forward', function () {
        expect(history.canGoForward()).toBe(false);
      });
    });

    describe('and then going back', function () {
      beforeEach(function () {
        history.back();
      });

      it('maintains the length', function () {
        expect(history.length).toEqual(2);
      });

      it('decrements current index by one', function () {
        expect(history.current).toEqual(0);
      });

      it('has the correct path', function () {
        expect(history.getPath()).toEqual('/');
      });

      it('cannot go back', function () {
        expect(history.canGoBack()).toBe(false);
      });

      it('can go forward', function () {
        expect(history.canGoForward()).toBe(true);
      });
     });
  });
});
