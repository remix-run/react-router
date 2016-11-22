'use strict';

var expect = require('expect');
var React = require('react');
var ReactDOMServer = require('react-dom/server');
var Router = require('../../index');
var NotFoundRoute = require('../NotFoundRoute');
var Route = require('../Route');

var _require = require('../../TestUtils');

var Nested = _require.Nested;
var Foo = _require.Foo;
var Bar = _require.Bar;

describe('NotFoundRoute', function () {

  describe('at the root of the config', function () {
    it('renders when no other routes match', function () {
      var routes = React.createElement(NotFoundRoute, { handler: Bar });
      Router.run(routes, '/ryans-patience', function (Handler) {
        var html = ReactDOMServer.renderToString(React.createElement(Handler, null));
        expect(html).toMatch(/Bar/);
      });
    });
  });

  describe('nested in the config', function () {
    it('renders when none of its siblings match', function () {
      var routes = React.createElement(
        Route,
        { path: '/', handler: Nested },
        React.createElement(Route, { path: '/foo', handler: Foo }),
        React.createElement(NotFoundRoute, { handler: Bar })
      );

      Router.run(routes, '/ryans-mind', function (Handler) {
        var html = ReactDOMServer.renderToString(React.createElement(Handler, null));
        expect(html).toMatch(/Bar/);
      });
    });
  });

  describe('deeply nested in the config', function () {
    var routes = React.createElement(
      Route,
      { path: '/', handler: Nested },
      React.createElement(
        Route,
        { path: 'ryans', handler: Nested },
        React.createElement(NotFoundRoute, { handler: Bar }),
        React.createElement(Route, { path: 'happiness', handler: Foo })
      )
    );

    it('renders the matching parents and itself', function () {
      Router.run(routes, '/ryans/compassion', function (Handler) {
        var html = ReactDOMServer.renderToString(React.createElement(Handler, null));
        expect(html).toMatch(/Nested/);
        expect(html).toMatch(/Bar/);
      });
    });

    it('does not match if a sibling matches', function () {
      Router.run(routes, '/ryans/happiness', function (Handler) {
        var html = ReactDOMServer.renderToString(React.createElement(Handler, null));
        expect(html).toMatch(/Nested/);
        expect(html).toMatch(/Foo/);
      });
    });
  });

  describe('with a name', function () {
    it('renders when none of its siblings match', function () {
      var routes = React.createElement(
        Route,
        { path: '/', handler: Nested },
        React.createElement(Route, { path: '/foo', handler: Foo }),
        React.createElement(NotFoundRoute, { name: 'not-found', handler: Bar })
      );

      Router.run(routes, '/ryans-mind', function (Handler) {
        var html = ReactDOMServer.renderToString(React.createElement(Handler, null));
        expect(html).toMatch(/Bar/);
      });
    });
  });
});
/* order shouldn't matter here, so we put it first */