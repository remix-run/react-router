var assert = require('assert');
var expect = require('expect');
var React = require('react');
var Route = require('../components/Route');
var Router = require('../Router');
var ActiveRouteHandler = require('../components/ActiveRouteHandler');
var ActiveState = require('../mixins/ActiveState');
var TestLocation = require('../locations/TestLocation');

describe('Router', function () {
  describe('transitions', function () {

    function redirect(transition) {
      transition.redirect('/foo');
    }

    function returnNull() { return null; }

    var Redirect = React.createClass({
      statics: { willTransitionTo: redirect },
      render: returnNull
    });

    var Foo = React.createClass({
      render: function () { return React.DOM.div({}, 'foo'); }
    });

    var routes = [
      Route({path: '/redirect', handler: Redirect}),
      Route({path: '/foo', handler: Foo})
    ];

    describe('transition.redirect', function () {
      it('redirects in willTransitionTo', function (done) {
        TestLocation.history = [ '/redirect' ];

        var div = document.createElement('div');

        Router.run(routes, TestLocation, function (Handler, state) {
          React.render(React.createElement(Handler), div, function () {
            expect(div.innerHTML).toMatch(/foo/);
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
    var Foo = React.createClass({
      render: function () { return React.DOM.div({}, this.props.query); }
    });

    it('renders with query params', function (done) {
      var routes = Route({handler: Foo, path: '/'});
      Router.run(routes, '/?foo=bar', function (Handler, state) {
        var html = React.renderToString(Handler({query: state.activeQuery.foo}));
        expect(html).toMatch(/bar/);
        done();
      });
    });
  });

  describe('willTransitionFrom', function () {
    it('sends a rendered component', function (done) {
      var div = document.createElement('div');

      var Foo = React.createClass({
        render: function () {
          return React.DOM.div({}, React.createElement(ActiveRouteHandler));
        }
      });

      var Bar = React.createClass({
        statics: {
          willTransitionFrom: function (transition, component) {
            expect(div.querySelector('#bar')).toEqual(component.getDOMNode());
            done();
          }
        },

        render: function () {
          return React.DOM.div({id: 'bar'}, 'bar');
        }
      });

      var routes = (
        Route({handler: Foo, path: '/'},
          Route({name: 'bar', handler: Bar}),
          Route({name: 'baz', handler: Bar})
        )
      );

      TestLocation.history = [ '/bar' ];

      Router.run(routes, TestLocation, function (Handler, state) {
        React.render(React.createElement(Handler), div, function () {
          TestLocation.push('/baz');
        });
      });
    });

  });

});

describe('Router.run', function () {

  var Nested = React.createClass({
    render: function () {
      return (
        <div>
          <h1>hello</h1>
          <ActiveRouteHandler/>
        </div>
      );
    }
  });

  var Echo = React.createClass({
    render: function () {
      return <div>{this.props.name}</div>;
    }
  });

  var ParamEcho = React.createClass({
    mixins: [ActiveState],
    render: function () {
      return <div>{this.getActiveParams().name}</div>
    }
  });

  var RPFlo = React.createClass({
    render: function () { return <div>rpflo</div>; }
  });

  var MJ = React.createClass({
    render: function () { return <div>mj</div>; }
  });

  it('matches a root route', function (done) {
    var routes = <Route path="/" handler={Echo} />;
    Router.run(routes, '/', function (Handler, state) {
      // TODO: figure out why we're getting this warning here
      // WARN: 'Warning: You cannot pass children to a RouteHandler'
      var html = React.renderToString(<Handler name="ryan"/>);
      expect(html).toMatch(/ryan/);
      done();
    });
  });

  it('matches an array of routes', function (done) {
    var routes = [
      <Route handler={RPFlo} path="/rpflo"/>,
      <Route handler={MJ} path="/mj"/>
    ];
    Router.run(routes, '/mj', function (Handler, state) {
      var html = React.renderToString(<Handler/>);
      expect(html).toMatch(/mj/);
      done();
    });
  });

  it('matches nested routes', function (done) {
    var routes = (
      <Route handler={Nested} path='/'>
        <Route handler={MJ} path='/mj'/>
      </Route>
    );
    Router.run(routes, '/mj', function (Handler, state) {
      var html = React.renderToString(<Handler/>);
      expect(html).toMatch(/hello/);
      expect(html).toMatch(/mj/);
      done();
    });
  });

  it('supports dynamic segments', function (done) {
    var routes = <Route handler={ParamEcho} path='/:name'/>;
    Router.run(routes, '/d00d3tt3', function (Handler, state) {
      var html = React.renderToString(<Handler/>);
      expect(html).toMatch(/d00d3tt3/);
      done();
    });
  });

  it('supports nested dynamic segments', function (done) {
    var routes = (
      <Route handler={Nested} path="/:foo">
        <Route handler={ParamEcho} path=":name"/>
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
        <Route handler={ParamEcho} path=':name'/>
      </Route>
    );
    var div = document.createElement('div');
    var count = 0;

    Router.run(routes, TestLocation, function (Handler, state) {
      React.render(<Handler/>, div, function () {
        count++;
        if (count == 1) {
          expect(div.innerHTML).toMatch(/foo/);
          div.querySelector('h1').innerHTML = 'lol i changed you';
          TestLocation.push('/bar');
        } else if (count == 2) {
          expect(div.innerHTML).toMatch(/bar/);
          expect(div.innerHTML).toMatch(/lol i changed you/);
          done();
        }
      });
    });
  });

  describe('RouteHandler', function () {
    it('throws if called after the router transitions to a new state');
  });

});
