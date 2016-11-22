'use strict';

var assert = require('assert');
var expect = require('expect');
var React = require('react');
var ReactTestUtils = require('react-addons-test-utils');
var ReactDOM = require('react-dom');
var Router = require('../../index');
var Route = require('../Route');
var Link = require('../Link');
var RouteHandler = require('../RouteHandler');
var TestLocation = require('../../locations/TestLocation');

var _require = require('../../TestUtils');

var Foo = _require.Foo;
var Bar = _require.Bar;
var click = ReactTestUtils.Simulate.click;

describe('A Link', function () {
  describe('with params and a query', function () {
    it('knows how to make its href', function () {
      var LinkHandler = React.createClass({
        displayName: 'LinkHandler',

        render: function render() {
          return React.createElement(
            Link,
            { to: 'foo', params: { bar: 'baz' }, query: { qux: 'quux' } },
            'Link'
          );
        }
      });

      var routes = [React.createElement(Route, { name: 'foo', path: 'foo/:bar', handler: Foo }), React.createElement(Route, { name: 'link', handler: LinkHandler })];

      var div = document.createElement('div');
      var location = new TestLocation(['/link']);

      Router.run(routes, location, function (Handler) {
        ReactDOM.render(React.createElement(Handler, null), div, function () {
          var a = div.querySelector('a');
          expect(a.getAttribute('href')).toEqual('/foo/baz?qux=quux');
        });
      });
    });
  });

  describe('when its route is active', function () {
    it('has an active class name', function (done) {
      var LinkHandler = React.createClass({
        displayName: 'LinkHandler',

        render: function render() {
          return React.createElement(
            'div',
            null,
            React.createElement(
              Link,
              {
                to: 'foo',
                className: 'dontKillMe',
                activeClassName: 'highlight'
              },
              'Link'
            ),
            React.createElement(RouteHandler, null)
          );
        }
      });

      var routes = React.createElement(
        Route,
        { path: '/', handler: LinkHandler },
        React.createElement(Route, { name: 'foo', handler: Foo }),
        React.createElement(Route, { name: 'bar', handler: Bar })
      );

      var div = document.createElement('div');
      var location = new TestLocation(['/foo']);
      var steps = [];

      function assertActive() {
        var a = div.querySelector('a');
        expect(a.className.split(' ').sort().join(' ')).toEqual('dontKillMe highlight');
      }

      function assertInactive() {
        var a = div.querySelector('a');
        expect(a.className).toEqual('dontKillMe');
      }

      steps.push(function () {
        assertActive();
        location.push('/bar');
      });

      steps.push(function () {
        assertInactive();
        location.push('/foo');
      });

      steps.push(function () {
        assertActive();
        done();
      });

      Router.run(routes, location, function (Handler) {
        ReactDOM.render(React.createElement(Handler, null), div, function () {
          steps.shift()();
        });
      });
    });

    it('has applies activeStyle', function (done) {
      var LinkHandler = React.createClass({
        displayName: 'LinkHandler',

        render: function render() {
          return React.createElement(
            'div',
            null,
            React.createElement(
              Link,
              {
                to: 'foo',
                style: { color: 'white' },
                activeStyle: { color: 'red' }
              },
              'Link'
            ),
            React.createElement(RouteHandler, null)
          );
        }
      });

      var routes = React.createElement(
        Route,
        { path: '/', handler: LinkHandler },
        React.createElement(Route, { name: 'foo', handler: Foo }),
        React.createElement(Route, { name: 'bar', handler: Bar })
      );

      var div = document.createElement('div');
      var location = new TestLocation(['/foo']);
      var steps = [];

      function assertActive() {
        var a = div.querySelector('a');
        expect(a.style.color).toEqual('red');
      }

      function assertInactive() {
        var a = div.querySelector('a');
        expect(a.style.color).toEqual('white');
      }

      steps.push(function () {
        assertActive();
        location.push('/bar');
      });

      steps.push(function () {
        assertInactive();
        location.push('/foo');
      });

      steps.push(function () {
        assertActive();
        done();
      });

      Router.run(routes, location, function (Handler) {
        ReactDOM.render(React.createElement(Handler, null), div, function () {
          steps.shift()();
        });
      });
    });
  });

  describe('when clicked', function () {
    it('calls a user defined click handler', function (done) {
      var LinkHandler = React.createClass({
        displayName: 'LinkHandler',

        handleClick: function handleClick(event) {
          assert.ok(true);
          done();
        },

        render: function render() {
          return React.createElement(
            Link,
            { to: 'foo', onClick: this.handleClick },
            'Link'
          );
        }
      });

      var routes = [React.createElement(Route, { name: 'foo', handler: Foo }), React.createElement(Route, { name: 'link', handler: LinkHandler })];
      var div = document.createElement('div');
      var location = new TestLocation(['/link']);

      Router.run(routes, location, function (Handler) {
        ReactDOM.render(React.createElement(Handler, null), div, function () {
          click(div.querySelector('a'));
        });
      });
    });

    it('transitions to the correct route', function (done) {
      var div = document.createElement('div');
      var location = new TestLocation(['/link']);

      var LinkHandler = React.createClass({
        displayName: 'LinkHandler',

        handleClick: function handleClick() {
          // just here to make sure click handlers don't prevent it from happening
        },

        render: function render() {
          return React.createElement(
            Link,
            { to: 'foo', onClick: this.handleClick },
            'Link'
          );
        }
      });

      var routes = [React.createElement(Route, { name: 'foo', handler: Foo }), React.createElement(Route, { name: 'link', handler: LinkHandler })];

      var steps = [];

      steps.push(function () {
        click(div.querySelector('a'), { button: 0 });
      });

      steps.push(function () {
        expect(div.innerHTML).toMatch(/Foo/);
        done();
      });

      Router.run(routes, location, function (Handler) {
        ReactDOM.render(React.createElement(Handler, null), div, function () {
          steps.shift()();
        });
      });
    });
  });
});