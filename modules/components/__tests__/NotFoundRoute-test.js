var expect = require('expect');
var React = require('react');
var ReactDOMServer = require('react-dom/server');
var Router = require('../../index');
var NotFoundRoute = require('../NotFoundRoute');
var Route = require('../Route');
var { Nested, Foo, Bar } = require('../../TestUtils');

describe('NotFoundRoute', function () {

  describe('at the root of the config', function () {
    it('renders when no other routes match', function () {
      var routes = <NotFoundRoute handler={Bar}/>;
      Router.run(routes, '/ryans-patience', function (Handler) {
        var html = ReactDOMServer.renderToString(<Handler />);
        expect(html).toMatch(/Bar/);
      });
    });
  });

  describe('nested in the config', function () {
    it('renders when none of its siblings match', function () {
      var routes = (
        <Route path='/' handler={Nested}>
          <Route path='/foo' handler={Foo}/>
          <NotFoundRoute handler={Bar} />
        </Route>
      );

      Router.run(routes, '/ryans-mind', function (Handler) {
        var html = ReactDOMServer.renderToString(<Handler/>);
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
        var html = ReactDOMServer.renderToString(<Handler />);
        expect(html).toMatch(/Nested/);
        expect(html).toMatch(/Bar/);
      });
    });

    it('does not match if a sibling matches', function () {
      Router.run(routes, '/ryans/happiness', function (Handler) {
        var html = ReactDOMServer.renderToString(<Handler />);
        expect(html).toMatch(/Nested/);
        expect(html).toMatch(/Foo/);
      });
    });
  });

  describe('with a name', function () {
    it('renders when none of its siblings match', function () {
      var routes = (
        <Route path='/' handler={Nested}>
          <Route path='/foo' handler={Foo}/>
          <NotFoundRoute name="not-found" handler={Bar} />
        </Route>
      );

      Router.run(routes, '/ryans-mind', function (Handler) {
        var html = ReactDOMServer.renderToString(<Handler/>);
        expect(html).toMatch(/Bar/);
      });
    });
  });

});
