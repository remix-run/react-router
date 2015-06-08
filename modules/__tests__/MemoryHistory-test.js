import expect from 'expect';
import describeHistory from './describeHistory';
import MemoryHistory from '../MemoryHistory';

describe('MemoryHistory', function () {
  describeHistory(new MemoryHistory('/'));

  var history;
  beforeEach(function () {
    history = new MemoryHistory('/');
  });

  describe('when first created', function () {
    it('cannot go back', function () {
      expect(history.canGoBack()).toBe(false);
    });

    it('cannot go forward', function () {
      expect(history.canGoForward()).toBe(false);
    });
  });

  describe('when pushing a new path', function () {
    beforeEach(function () {
      history.pushState(null, '/push');
    });

    it('increments current index by one', function () {
      expect(history.current).toEqual(1);
    });

    it('has the correct path', function () {
      expect(history.location.path).toEqual('/push');
    });

    it('can go back', function () {
      expect(history.canGoBack()).toBe(true);
    });

    it('cannot go forward', function () {
      expect(history.canGoForward()).toBe(false);
    });
 
    describe('and then replacing that path', function () {
      beforeEach(function () {
        history.replaceState(null, '/replace');
      });

      it('maintains the current index', function () {
        expect(history.current).toEqual(1);
      });

      it('returns the correct path', function () {
        expect(history.location.path).toEqual('/replace');
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

      it('decrements current index by one', function () {
        expect(history.current).toEqual(0);
      });

      it('has the correct path', function () {
        expect(history.location.path).toEqual('/');
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
