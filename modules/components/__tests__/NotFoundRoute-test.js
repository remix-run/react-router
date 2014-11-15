/** @jsx React.DOM */
var assert = require('assert');
var expect = require('expect');
var React = require('react/addons');
var NotFoundRoute = require('../NotFoundRoute');
var Route = require('../Route');
var Router = require('../../Router');
var ActiveRouteHandler = require('../../components/ActiveRouteHandler');
var { Nested, Foo, Bar } = require('../../__tests__/testHandlers');

describe('NotFoundRoute', function () {

  describe('at the root of the config', function () {
    it('renders when no routes match', function () {
      var routes = <NotFoundRoute handler={Bar}/>;
      Router.run(routes, '/ryans-patience', function (Handler) {
        var html = React.renderToString(<Handler />);
        expect(html).toMatch(/Bar/);
      });
    });
  });

  describe('nested in the config', function () {
    it('renders', function () {
      var routes = (
        <Route path='/' handler={Nested}>
          <Route path='/foo' handler={Foo}/>
          <NotFoundRoute handler={Bar} />
        </Route>
      );

      Router.run(routes, '/ryans-mind', function (Handler) {
        var html = React.renderToString(<Handler/>);
        expect(html).toMatch(/Bar/);
      });
    });
  });

  describe('deeply nested in the config', function () {
    var routes = (
      <Route path='/' handler={Nested}>
        <Route path='ryans' handler={Nested}>
          {/* order shouldn't matter here, so we put it first */}
          <NotFoundRoute handler={Bar} />
          <Route path='happiness' handler={Foo}/>
        </Route>
      </Route>
    );

    it('renders the matching parents and itself', function () {
      Router.run(routes, '/ryans/compassion', function (Handler) {
        var html = React.renderToString(<Handler />);
        expect(html).toMatch(/Nested/);
        expect(html).toMatch(/Bar/);
      });
    });

    it('does not match if a sibling matches', function () {
      Router.run(routes, '/ryans/happiness', function (Handler) {
        var html = React.renderToString(<Handler />);
        expect(html).toMatch(/Nested/);
        expect(html).toMatch(/Foo/);
      });
    });
  });

});

