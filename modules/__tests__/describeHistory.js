import expect, { createSpy, spyOn } from 'expect';
import History from '../History';

export default function describeHistory(history) {
  it('is an instanceof History', function () {
    expect(history).toBeA(History);
  });

  var RequiredMethods = [ 'pushState', 'replaceState', 'go' ];

  RequiredMethods.forEach(function (method) {
    it('has a ' + method + ' method', function () {
      expect(history[method]).toBeA('function');
    });
  });

  describe('adding/removing a listener', function () {
    var pushState, go, pushStateSpy, goSpy;
    beforeEach(function () {
      // It's a bit tricky to test change listeners properly because
      // they are triggered when the URL changes. So we need to stub
      // out push/go to only notify listeners ... but we can't make
      // assertions on the location because it will be wrong.
      pushState = history.pushState;
      pushStateSpy = spyOn(history, 'pushState').andCall(history._notifyChange);

      go = history.go;
      goSpy = spyOn(history, 'go').andCall(history._notifyChange);
    });

    afterEach(function () {
      history.push = pushState;
      history.go = go;
    });

    it('works', function () {
      var spy = expect.createSpy(function () {});

      history.addChangeListener(spy);
      history.pushState(null, '/home'); // call #1
      expect(pushStateSpy).toHaveBeenCalled();

      expect(spy.calls.length).toEqual(1);

      history.removeChangeListener(spy)
      history.back(); // call #2
      expect(goSpy).toHaveBeenCalled();

      expect(spy.calls.length).toEqual(1);
    });
  });
}
