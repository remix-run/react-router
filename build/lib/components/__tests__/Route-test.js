'use strict';

var expect = require('expect');
var React = require('react');
var ReactDOMServer = require('react-dom/server');
var Router = require('../../index');
var DefaultRoute = require('../DefaultRoute');
var Route = require('../Route');

var _require = require('../../TestUtils');

var Foo = _require.Foo;
var Bar = _require.Bar;

describe('Route', function () {

  it('renders default child route if path match but no handler provided', function () {
    var routes = React.createElement(
      Route,
      { path: '/' },
      React.createElement(Route, { path: '/bar', handler: Bar }),
      React.createElement(DefaultRoute, { handler: Foo })
    );

    Router.run(routes, '/', function (App) {
      var html = ReactDOMServer.renderToString(React.createElement(App, null));
      expect(html).toMatch(/Foo/);
    });
  });

  it('renders matched child route if no handler provided', function () {
    var routes = React.createElement(
      Route,
      { path: '/' },
      React.createElement(Route, { path: '/bar', handler: Bar }),
      React.createElement(DefaultRoute, { handler: Foo })
    );

    Router.run(routes, '/bar', function (App) {
      var html = ReactDOMServer.renderToString(React.createElement(App, null));
      expect(html).toMatch(/Bar/);
    });
  });
});