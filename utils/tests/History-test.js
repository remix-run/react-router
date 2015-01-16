var expect = require('expect');
var React = require('react');
var { Foo, RedirectToFoo } = require('../../utils/TestHandlers');
var TestLocation = require('../../locations/TestLocation');
var Route = require('../../components/Route');
var Router = require('../../index');
var History = require('../History');

describe('History', function () {
  describe('on the initial page load', function () {
    it('has length 1', function () {
      expect(History.length).toEqual(1);
    });
  });

  describe('after navigating to a route', function () {
    beforeEach(function () {
      TestLocation.history = [ '/foo' ];
    });

    it('has length 2', function (done) {
      var routes = [
        <Route name="foo" handler={Foo}/>,
        <Route name="about" handler={Foo}/>
      ];

      var count = 0;

      var router = Router.run(routes, TestLocation, function (Handler) {
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

        var router = Router.run(routes, TestLocation, function (Handler) {
          count += 1;

          if (count === 2) {
            expect(History.length).toEqual(2);
            done();
          }
        });

        router.transitionTo('about');
      });
    });
  });
});
