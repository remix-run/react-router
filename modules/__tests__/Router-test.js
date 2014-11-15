var assert = require('assert');
var expect = require('expect');
var React = require('react');
var Route = require('../components/Route');
var Router = require('../Router');
var ActiveRouteHandler = require('../components/ActiveRouteHandler');
var ActiveState = require('../mixins/ActiveState');
var TestLocation = require('../locations/TestLocation');
var {
  Bar,
  EchoFooProp,
  Foo,
  Nested,
  EchoBarParam,
  MJ,
  RedirectToFoo,
  RPFlo
} = require('./testHandlers');

describe('Router', function () {
  describe('transitions', function () {

    var routes = [
      <Route path="/redirect" handler={RedirectToFoo}/>,
      <Route path="/foo" handler={Foo}/>
    ];

    describe('transition.redirect', function () {
      it('redirects in willTransitionTo', function (done) {
        TestLocation.history = [ '/redirect' ];

        var div = document.createElement('div');

        Router.run(routes, TestLocation, function (Handler, state) {
          React.render(<Handler/>, div, function () {
            expect(div.innerHTML).toMatch(/Foo/);
            done();
          });
        });
      });
    });

    describe('transition.abort', function () {
      it('aborts in willTransitionTo');
    });
  });

  describe('query params', function () {
    it('renders with query params', function (done) {
      var routes = <Route handler={EchoFooProp} path='/'/>;
      Router.run(routes, '/?foo=bar', function (Handler, state) {
        var html = React.renderToString(<Handler foo={state.activeQuery.foo} />);
        expect(html).toMatch(/bar/);
        done();
      });
    });
  });

  describe('willTransitionFrom', function () {
    it('sends a rendered component', function (done) {
      var div = document.createElement('div');

      var Bar = React.createClass({
        statics: {
          willTransitionFrom: function (transition, component) {
            expect(div.querySelector('#bar')).toEqual(component.getDOMNode());
            done();
          }
        },

        render: function () {
          return <div id="bar">bar</div>;
        }
      });

      var routes = (
        <Route handler={Nested} path='/'>
          <Route name="bar" handler={Bar}/>
          <Route name="baz" handler={Bar}/>
        </Route>
      );

      TestLocation.history = [ '/bar' ];

      Router.run(routes, TestLocation, function (Handler, state) {
        React.render(<Handler/>, div, function () {
          TestLocation.push('/baz');
        });
      });
    });

  });

});

describe('Router.run', function () {

  it('matches a root route', function (done) {
    var routes = <Route path="/" handler={EchoFooProp} />;
    Router.run(routes, '/', function (Handler, state) {
      // TODO: figure out why we're getting this warning here
      // WARN: 'Warning: You cannot pass children to a RouteHandler'
      var html = React.renderToString(<Handler foo="bar"/>);
      expect(html).toMatch(/bar/);
      done();
    });
  });

  it('matches an array of routes', function (done) {
    var routes = [
      <Route handler={Foo} path="/foo"/>,
      <Route handler={Bar} path="/bar"/>
    ];
    Router.run(routes, '/foo', function (Handler, state) {
      var html = React.renderToString(<Handler/>);
      expect(html).toMatch(/Foo/);
      done();
    });
  });

  it('matches nested routes', function (done) {
    var routes = (
      <Route handler={Nested} path='/'>
        <Route handler={Foo} path='/foo'/>
      </Route>
    );
    Router.run(routes, '/foo', function (Handler, state) {
      var html = React.renderToString(<Handler/>);
      expect(html).toMatch(/Nested/);
      expect(html).toMatch(/Foo/);
      done();
    });
  });

  it('renders root handler only once', function (done) {
    var div = document.createElement('div');
    var routes = (
      <Route handler={Nested} path='/'>
        <Route handler={Foo} path='/Foo'/>
      </Route>
    );
    Router.run(routes, '/Foo', function (Handler, state) {
      React.render(<Handler/>, div, function() {
        expect(div.querySelectorAll('.Nested').length).toEqual(1);
        done();
      });
    });
  });

  it('supports dynamic segments', function (done) {
    var routes = <Route handler={EchoBarParam} path='/:bar'/>;
    Router.run(routes, '/d00d3tt3', function (Handler, state) {
      var html = React.renderToString(<Handler/>);
      expect(html).toMatch(/d00d3tt3/);
      done();
    });
  });

  it('supports nested dynamic segments', function (done) {
    var routes = (
      <Route handler={Nested} path="/:foo">
        <Route handler={EchoBarParam} path=":bar"/>
      </Route>
    );
    Router.run(routes, '/foo/bar', function (Handler, state) {
      var html = React.renderToString(<Handler />);
      expect(html).toMatch(/bar/);
      done();
    });
  });

  it('does not blow away the previous HTML', function (done) {
    TestLocation.history = [ '/foo' ];

    var routes = (
      <Route handler={Nested} path='/'>
        <Route handler={EchoBarParam} path=':bar'/>
      </Route>
    );
    var div = document.createElement('div');
    var steps = [];

    steps.push(function() {
      expect(div.innerHTML).toMatch(/foo/);
      div.querySelector('h1').innerHTML = 'lol i changed you';
      TestLocation.push('/bar');
    });

    steps.push(function() {
      expect(div.innerHTML).toMatch(/bar/);
      expect(div.innerHTML).toMatch(/lol i changed you/);
      done();
    });

    Router.run(routes, TestLocation, function (Handler, state) {
      React.render(<Handler/>, div, function () {
        steps.shift()();
      });
    });
  });

  describe('RouteHandler', function () {
    it('throws if called after the router transitions to a new state');
  });

  describe('locations', function() {
    it('defaults to HashLocation', function(done) {
      var routes = <Route path="/" handler={Foo}/>
      var div = document.createElement('div');
      Router.run(routes, function(Handler) {
        React.render(<Handler/>, div, function() {
          this.getLocation() === Router.HashLocation;
          done();
        });
      });
    });
  });

});
