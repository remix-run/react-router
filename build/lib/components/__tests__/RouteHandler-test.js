'use strict';

var expect = require('expect');
var React = require('react');
var ReactDOM = require('react-dom');
var Router = require('../../index');
var Route = require('../Route');
var RouteHandler = require('../RouteHandler');
var TestLocation = require('../../locations/TestLocation');

var _require = require('../../TestUtils');

var Bar = _require.Bar;
var Foo = _require.Foo;

describe('RouteHandler', function () {

  it('uses the old handler until the top-level component is rendered again', function (done) {
    var updateComponentBeforeNextRender;
    var location = new TestLocation(['/foo']);

    var Root = React.createClass({
      displayName: 'Root',

      componentDidMount: function componentDidMount() {
        updateComponentBeforeNextRender = (function (cb) {
          this.forceUpdate(cb);
        }).bind(this);
      },

      render: function render() {
        return React.createElement(
          'div',
          null,
          React.createElement(
            'h1',
            null,
            'Root'
          ),
          React.createElement(RouteHandler, null)
        );
      }
    });

    var routes = React.createElement(
      Route,
      { name: 'root', handler: Root, path: '/' },
      React.createElement(Route, { name: 'foo', handler: Foo, path: '/foo' }),
      React.createElement(Route, { name: 'bar', handler: Bar, path: '/bar' })
    );

    var div = document.createElement('div');
    var steps = [];

    steps.push(function (Handler, state) {
      ReactDOM.render(React.createElement(Handler, null), div, function () {
        expect(div.innerHTML).toMatch(/Foo/);
        location.push('/bar');
      });
    });

    steps.push(function (Handler, state) {
      updateComponentBeforeNextRender(function () {
        expect(div.innerHTML).toMatch(/Foo/);
        ReactDOM.render(React.createElement(Handler, null), div, function () {
          expect(div.innerHTML).toMatch(/Bar/);
          done();
        });
      });
    });

    Router.run(routes, location, function () {
      steps.shift().apply(this, arguments);
    });
  });

  it('renders after an update', function (done) {
    var Nested = React.createClass({
      displayName: 'Nested',

      componentDidMount: function componentDidMount() {
        this.forceUpdate(finishTest);
      },
      render: function render() {
        return React.createElement(
          'div',
          null,
          'hello',
          React.createElement(RouteHandler, null)
        );
      }
    });

    var Foo = React.createClass({
      displayName: 'Foo',

      render: function render() {
        return React.createElement(
          'div',
          null,
          'foo'
        );
      }
    });

    var routes = React.createElement(
      Route,
      { path: '/', handler: Nested },
      React.createElement(Route, { path: 'foo', handler: Foo })
    );

    var div = document.createElement('div');

    Router.run(routes, '/foo', function (App) {
      ReactDOM.render(React.createElement(App, null), div);
    });

    function finishTest() {
      expect(div.innerHTML).toMatch(/hello/);
      expect(div.innerHTML).toMatch(/foo/);
      done();
    }
  });
});