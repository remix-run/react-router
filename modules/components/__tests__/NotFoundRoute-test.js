/** @jsx React.DOM */
var assert = require('assert');
var expect = require('expect');
var React = require('react/addons');
var NotFoundRoute = require('../NotFoundRoute');
var Route = require('../Route');
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

var NotFound = React.createClass({
  render: function () {
    return <div>not found</div>;
  }
});



describe('NotFoundRoute', function () {

  describe('at the root of the config', function () {
    it('renders when no routes match', function () {
      var routes = <NotFoundRoute handler={NotFound}/>;
      Router.run(routes, '/ryans-patience', function (Handler) {
        var html = React.renderToString(<Handler />);
        expect(html).toMatch(/not found/);
      });
    });
  });

  describe('nested in the config', function () {
    it('renders', function () {
      var routes = (
        <Route path='/' handler={Nested}>
          <Route path='/foo' handler={Foo}/>
          <NotFoundRoute handler={NotFound} />
        </Route>
      );

      Router.run(routes, '/ryans-mind', function (App) {
        var html = React.renderToString(App());
        expect(html).toMatch(/not found/);
      });
    });
  });

  describe('deeply nested in the config', function () {
    var routes = (
      <Route path='/' handler={Nested}>
        <Route path='ryans' handler={Nested}>
          {/* order shouldn't matter here, so we put it first */}
          <NotFoundRoute handler={NotFound} />
          <Route path='happiness' handler={Foo}/>
        </Route>
      </Route>
    );

    it('renders the matching parents and itself', function () {
      Router.run(routes, '/ryans/compassion', function (App) {
        var html = React.renderToString(<App />);
        expect(html).toMatch(/hello/);
        expect(html).toMatch(/not found/);
      });
    });

    it('does not match if a sibling matches', function () {
      Router.run(routes, '/ryans/happiness', function (App) {
        var html = React.renderToString(<App />);
        expect(html).toMatch(/hello/);
        expect(html).toMatch(/foo/);
      });
    });
  });

});

