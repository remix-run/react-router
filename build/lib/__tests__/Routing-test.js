'use strict';

var expect = require('expect');
var React = require('react');
var ReactDOMServer = require('react-dom/server');
var Router = require('../index');
var Route = require('../components/Route');

var _require = require('../TestUtils');

var Foo = _require.Foo;
var Bar = _require.Bar;
var Nested = _require.Nested;

describe('creating routes from ReactChildren', function () {
  it('works with falsy children', function (done) {
    var routes = [React.createElement(Route, { handler: Foo, path: '/foo' }), null, React.createElement(Route, { handler: Bar, path: '/bar' }), undefined];

    Router.run(routes, '/foo', function (Handler, state) {
      var html = ReactDOMServer.renderToString(React.createElement(Handler, null));
      expect(html).toMatch(/Foo/);
      done();
    });
  });

  it('works with comments', function (done) {
    var routes = [React.createElement(
      Route,
      { handler: Nested, path: '/foo' },
      '// This is a comment.',
      React.createElement(Route, { handler: Bar, path: '/bar' })
    )];

    Router.run(routes, '/bar', function (Handler, state) {
      var html = ReactDOMServer.renderToString(React.createElement(Handler, null));
      expect(html).toMatch(/Bar/);
      done();
    });
  });
});