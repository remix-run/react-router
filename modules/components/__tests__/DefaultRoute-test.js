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

describe.only('DefaultRoute', function() {

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



});

//describe('A DefaultRoute', function () {


  //describe('nested in another Route', function () {
    //var component, route, defaultRoute;
    //beforeEach(function () {
      //component = ReactTestUtils.renderIntoDocument(
        //Routes({ location: 'none' },
          //route = Route({ handler: NullHandler },
            //defaultRoute = DefaultRoute({ handler: NullHandler })
          //)
        //)
      //);
    //});

    //afterEach(function () {
      //React.unmountComponentAtNode(component.getDOMNode());
    //});

    //it('becomes that route\'s defaultRoute', function () {
      //expect(route.props.defaultRoute).toBe(defaultRoute);
    //});
  //});

//});

//describe('when no child routes match a URL, but the parent\'s path matches', function () {

  //var component, rootRoute, defaultRoute;
  //beforeEach(function (done) {
    //component = ReactTestUtils.renderIntoDocument(
      //Routes({ location: 'none' },
        //rootRoute = Route({ name: 'user', path: '/users/:id', handler: NullHandler },
          //Route({ name: 'home', path: '/users/:id/home', handler: NullHandler }),
          //// Make it the middle sibling to test order independence.
          //defaultRoute = DefaultRoute({ handler: NullHandler }),
          //Route({ name: 'news', path: '/users/:id/news', handler: NullHandler })
        //)
      //)
    //);

    //component.dispatch('/users/5', done);
  //});

  //afterEach(function () {
    //React.unmountComponentAtNode(component.getDOMNode());
  //});

  //it('matches the default route', function () {
    //var matches = component.match('/users/5');
    //assert(matches);
    //expect(matches.length).toEqual(2);
    //expect(matches[0].route).toBe(rootRoute);
    //expect(matches[1].route).toBe(defaultRoute);
  //});

//});
