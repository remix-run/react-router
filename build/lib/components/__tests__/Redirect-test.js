'use strict';

var expect = require('expect');
var React = require('react');
var ReactDOM = require('react-dom');
var Router = require('../../index');
var TestLocation = require('../../locations/TestLocation');

var _require = require('../../TestUtils');

var Nested = _require.Nested;
var Bar = _require.Bar;

var Redirect = require('../Redirect');
var Route = require('../Route');

describe('Redirect', function () {

  it('defaults the path to "*"', function () {
    var location = new TestLocation(['/kljfsdlfkjsdf']);

    var div = document.createElement('div');
    var routes = [React.createElement(Route, { path: '/bar', handler: Bar }), React.createElement(Redirect, { to: '/bar' })];

    Router.run(routes, location, function (Handler) {
      ReactDOM.render(React.createElement(Handler, null), div);
      expect(div.innerHTML).toMatch(/Bar/);
    });
  });

  describe('at the root of the config', function () {
    it('redirects', function () {
      var location = new TestLocation(['/foo']);

      var div = document.createElement('div');
      var routes = [React.createElement(Redirect, { from: '/foo', to: '/bar' }), React.createElement(Route, { path: '/bar', handler: Bar })];

      Router.run(routes, location, function (Handler) {
        ReactDOM.render(React.createElement(Handler, null), div);
        expect(div.innerHTML).toMatch(/Bar/);
      });
    });
  });

  describe('nested deeply in the config', function () {
    it('redirects with absolute paths', function () {
      var location = new TestLocation(['/foo/bar']);

      var div = document.createElement('div');
      var routes = React.createElement(
        Route,
        { path: '/', handler: Nested },
        React.createElement(
          Route,
          { path: 'foo', handler: Nested },
          React.createElement(Redirect, { from: '/foo/bar', to: '/baz' })
        ),
        React.createElement(Route, { path: 'baz', handler: Bar })
      );

      Router.run(routes, location, function (Handler) {
        ReactDOM.render(React.createElement(Handler, null), div);
        expect(div.innerHTML).toMatch(/Bar/);
      });
    });

    it('redirects with relative paths', function () {
      var location = new TestLocation(['/foo/bar']);

      var div = document.createElement('div');
      var routes = React.createElement(
        Route,
        { path: '/', handler: Nested },
        React.createElement(
          Route,
          { path: 'foo', handler: Nested },
          React.createElement(Redirect, { from: 'bar', to: '/baz' })
        ),
        React.createElement(Route, { path: 'baz', handler: Bar })
      );

      Router.run(routes, location, function (Handler) {
        ReactDOM.render(React.createElement(Handler, null), div);
        expect(div.innerHTML).toMatch(/Bar/);
      });
    });
  });
});