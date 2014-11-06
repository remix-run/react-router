/** @jsx React.DOM */

var assert = require('assert');
var expect = require('expect');
var React = require('react/addons');
var DefaultRoute = require('../DefaultRoute');
var Route = require('../Route');
var DefaultRoute = require('../DefaultRoute');
var Router = require('../../Router');
var ActiveRouteHandler = require('../../components/ActiveRouteHandler');

var Nested = React.createClass({
  render: function () {
    return (
      <div>
        hello
        <ActiveRouteHandler />
      </div>
    );
  }
});

var Foo = React.createClass({
  render: function () {
    return <div>foo</div>;
  }
});

var Bar = React.createClass({
  render: function () {
    return <div>bar</div>;
  }
});



describe('DefaultRoute', function() {

  it('renders when the parent route path matches', function () {
    var routes = (
      <Route path='/' handler={Nested}>
        <DefaultRoute handler={Foo} />
      </Route>
    );

    Router.run(routes, '/', function (App) {
      var html = React.renderToString(App());
      expect(html).toMatch(/hello/);
      expect(html).toMatch(/foo/);
    });
  });

  it('renders when nested more than one level', function () {
    var routes = (
      <Route path='/' handler={Nested}>
        <Route path='/foo' handler={Nested}>
          <DefaultRoute handler={Foo} />
        </Route>
      </Route>
    );

    Router.run(routes, '/foo', function (App) {
      var html = React.renderToString(App());
      expect(html).toMatch(/foo/);
    });
  });

  it('renders when no siblings match', function () {
    var routes = (
      <Route path='/' handler={Nested}>
        <Route path='/foo' handler={Nested}>
          <DefaultRoute handler={Foo} />
          <Route path="/bar" handler={Bar} />
        </Route>
      </Route>
    );

    Router.run(routes, '/foo', function (App) {
      var html = React.renderToString(App());
      expect(html).toMatch(/foo/);
      expect(html.match(/bar/)).toEqual(null);
    });
  });



});

