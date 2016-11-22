'use strict';

var expect = require('expect');
var React = require('react');

var _require = require('../TestUtils');

var Foo = _require.Foo;
var RedirectToFoo = _require.RedirectToFoo;

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
      location = new TestLocation(['/foo']);
    });

    it('has length 2', function (done) {
      var routes = [React.createElement(Route, { name: 'foo', handler: Foo }), React.createElement(Route, { name: 'about', handler: Foo })];

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
        var routes = [React.createElement(Route, { name: 'foo', handler: Foo }), React.createElement(Route, { name: 'about', handler: RedirectToFoo })];

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