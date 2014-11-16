/** @jsx React.DOM */
var assert = require('assert');
var expect = require('expect');
var React = require('react/addons');
var Router = require('../../Router');
var TestLocation = require('../../locations/TestLocation');
var Redirect = require('../Redirect');
var Route = require('../Route');
var RouteHandler = require('../RouteHandler');

var Nested = React.createClass({
  render: function () {
    return (
      <div>
        hello
        <RouteHandler />
      </div>
    );
  }
});

var Foo = React.createClass({
  render: function () {
    return <div>foo</div>;
  }
});

var RedirectTarget = React.createClass({
  render: function () {
    return <div>redirected</div>;
  }
});



describe('Redirect', function () {

  describe('at the root of the config', function () {
    it('redirects', function () {
      TestLocation.history = [ '/foo' ];

      var div = document.createElement('div');
      var routes = [
        <Redirect from="/foo" to="/bar"/>,
        <Route path="/bar" handler={RedirectTarget}/>
      ];

      Router.run(routes, TestLocation, function (Handler) {
        var html = React.render(<Handler />, div);
        expect(div.innerHTML).toMatch(/redirected/);
      });
    });
  });

  describe('nested deeply in the config', function () {
    it('redirects with absolute paths', function () {
      TestLocation.history = [ '/foo/bar' ];

      var div = document.createElement('div');
      var routes = (
        <Route path="/" handler={Nested}>
          <Route path="foo" handler={Nested}>
            <Redirect from="/foo/bar" to="/baz" />
          </Route>
          <Route path="baz" handler={RedirectTarget}/>
        </Route>
      );

      Router.run(routes, TestLocation, function (Handler) {
        var html = React.render(<Handler />, div);
        expect(div.innerHTML).toMatch(/redirected/);
      });
    });

    it('redirects with relative paths', function () {
      TestLocation.history = [ '/foo/bar' ];

      var div = document.createElement('div');
      var routes = (
        <Route path="/" handler={Nested}>
          <Route path="foo" handler={Nested}>
            <Redirect from="bar" to="/baz" />
          </Route>
          <Route path="baz" handler={RedirectTarget}/>
        </Route>
      );

      Router.run(routes, TestLocation, function (Handler) {
        var html = React.render(<Handler />, div);
        expect(div.innerHTML).toMatch(/redirected/);
      });
    });
  });
});

