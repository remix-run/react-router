var expect = require('expect');
var React = require('react');
var Router = require('../../index');
var DefaultRoute = require('../DefaultRoute');
var Route = require('../Route');
var { Foo, Bar } = require('../../TestUtils');

describe('Route', function () {

  it('renders default child route if path match but no handler provided', function () {
    var routes = (
      <Route path='/'>
        <Route path='/bar' handler={Bar} />
        <DefaultRoute handler={Foo} />
      </Route>
    );

    Router.run(routes, '/', function (App) {
      var html = React.renderToString(<App/>);
      expect(html).toMatch(/Foo/);
    });
  });

  it('renders matched child route if no handler provided', function () {
    var routes = (
      <Route path='/'>
        <Route path='/bar' handler={Bar} />
        <DefaultRoute handler={Foo} />
      </Route>
    );

    Router.run(routes, '/bar', function (App) {
      var html = React.renderToString(<App/>);
      expect(html).toMatch(/Bar/);
    });
  });

  it('supports meta data', function (done) {
    var routes = <Route handler={Foo} path='/' meta={{foo: 'bar'}}/>;
    Router.run(routes, '/', function (Handler, state) {
      var route = state.routes[0];
      expect(route.meta).toEqual({foo: 'bar'});
      done();
    });
  });

});
