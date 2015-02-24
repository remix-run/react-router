var expect = require('expect');
var React = require('react');
var Router = require('../../index');
var DefaultRoute = require('../DefaultRoute');
var Route = require('../Route');
var { Foo, Bar, Nested } = require('../../TestUtils');

describe('DefaultRoute', function () {

  it('renders when the parent route path matches', function () {
    var routes = (
      <Route path='/' handler={Nested}>
        <DefaultRoute handler={Foo} />
      </Route>
    );

    Router.run(routes, '/', function (App) {
      var html = React.renderToString(<App/>);
      expect(html).toMatch(/Nested/);
      expect(html).toMatch(/Foo/);
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
      var html = React.renderToString(<App/>);
      expect(html).toMatch(/Foo/);
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
      var html = React.renderToString(<App/>);
      expect(html).toMatch(/Foo/);
      expect(html.match(/Bar/)).toEqual(null);
    });
  });

});
