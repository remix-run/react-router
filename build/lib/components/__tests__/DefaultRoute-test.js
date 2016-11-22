'use strict';

var expect = require('expect');
var React = require('react');
var ReactDOMServer = require('react-dom/server');
var Router = require('../../index');
var DefaultRoute = require('../DefaultRoute');
var Route = require('../Route');

var _require = require('../../TestUtils');

var Foo = _require.Foo;
var Nested = _require.Nested;

describe('DefaultRoute', function () {

  it('renders when the parent route path matches', function () {
    var routes = React.createElement(
      Route,
      { path: '/', handler: Nested },
      React.createElement(DefaultRoute, { handler: Foo })
    );

    Router.run(routes, '/', function (App) {
      var html = ReactDOMServer.renderToString(React.createElement(App, null));
      expect(html).toMatch(/Nested/);
      expect(html).toMatch(/Foo/);
    });
  });

  it('renders when nested more than one level', function () {
    var routes = React.createElement(
      Route,
      { path: '/', handler: Nested },
      React.createElement(
        Route,
        { path: '/foo', handler: Nested },
        React.createElement(DefaultRoute, { handler: Foo })
      )
    );

    Router.run(routes, '/foo', function (App) {
      var html = ReactDOMServer.renderToString(React.createElement(App, null));
      expect(html).toMatch(/Nested/);
      expect(html).toMatch(/Foo/);
    });
  });

  describe('with a name', function () {
    it('renders when the parent route path matches', function () {
      var routes = React.createElement(
        Route,
        { path: '/', handler: Nested },
        React.createElement(DefaultRoute, { name: 'root', handler: Foo })
      );

      Router.run(routes, '/', function (App) {
        var html = ReactDOMServer.renderToString(React.createElement(App, null));
        expect(html).toMatch(/Nested/);
        expect(html).toMatch(/Foo/);
      });
    });
  });
});