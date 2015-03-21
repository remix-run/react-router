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
  });
});
