var expect = require('expect');
var React = require('react');
var { Foo, RedirectToFoo } = require('../TestUtils');
var TestLocation = require('../locations/TestLocation');
var Route = require('../components/Route');
var History = require('../History');
var Router = require('../index');

describe('History', function () {
  describe('on the initial page load', function () {
    it('has length 1', function () {
      expect(History.length).toEqual(1);
    });

    describe('calling goBack()', function () {
      it('returns false', function () {
        var routes = <Route name="foo" handler={Foo}/>;
        var location = new TestLocation([ '/foo' ]);
        var router = Router.run(routes, location, function (Handler) { });
        var consoleWarn = console.warn;
        var emittedWarning;

        console.warn = function(message) { emittedWarning = message; };

        expect(router.goBack()).toBe(false);
        expect(emittedWarning).toMatch(/no router history/);

        console.warn = consoleWarn;
      });
    });

    describe('calling goBackOrTransitionTo(route)', function () {
      it('transitions to the specified route', function (done) {
        var location = new TestLocation([ '/foo' ]);
        var routes = [
          <Route name="foo" handler={Foo}/>,
          <Route name="about" handler={Foo}/>
        ];

        var count = 0;

        var router = Router.run(routes, location, function (Handler, state) {
          count += 1;

          if (count === 2) {
            expect(state.path).toEqual('/about');
            done();
          }
        });

        router.goBackOrTransitionTo('about');
      });
    });
  });

  describe('after navigating to a route', function () {
    var location;
    beforeEach(function () {
      location = new TestLocation([ '/foo' ]);
    });

    it('has length 2', function (done) {
      var routes = [
        <Route name="foo" handler={Foo}/>,
        <Route name="about" handler={Foo}/>
      ];

      var count = 0;

      var router = Router.run(routes, location, function (Handler) {
        count += 1;

        if (count === 2) {
          expect(History.length).toEqual(2);
          done();
        }
      });

      router.transitionTo('about');
    });

    describe('that redirects to another route', function () {
      it('has length 2', function (done) {
        var routes = [
          <Route name="foo" handler={Foo}/>,
          <Route name="about" handler={RedirectToFoo}/>
        ];

        var count = 0;

        var router = Router.run(routes, location, function (Handler) {
          count += 1;

          if (count === 2) {
            expect(History.length).toEqual(2);
            done();
          }
        });

        router.transitionTo('about');
      });
    });

    describe('calling goBack()', function () {
      it('transitions to the previous route', function (done) {
        var routes = [
          <Route name="foo" handler={Foo}/>,
          <Route name="about" handler={Foo}/>
        ];

        var count = 0;

        var router = Router.run(routes, location, function (Handler, state) {
          count += 1;

          if (count === 2) {
            expect(state.path).toEqual('/about');
            expect(router.goBack()).toBe(true);
          }

          if (count === 3) {
            expect(state.path).toEqual('/foo');
            done();
          }
        });

        router.transitionTo('about');
      });
    });

    describe('calling goBackOrTransitionTo()', function () {
      it('transitions to the previous route', function (done) {
        var routes = [
          <Route name="foo" handler={Foo}/>,
          <Route name="about" handler={Foo}/>,
          <Route name="other" handler={Foo}/>
        ];

        var count = 0;

        var router = Router.run(routes, location, function (Handler, state) {
          count += 1;

          if (count === 2) {
            expect(state.path).toEqual('/about');
            router.goBackOrTransitionTo('other');
          }

          if (count === 3) {
            expect(state.path).toEqual('/foo');
            done();
          }
        });

        router.transitionTo('about');
      });
    });
  });
});
