var assert = require('assert');
var expect = require('expect');
var React = require('react');
var Route = require('../components/Route');
var Router = require('../Router');
var runRouter = require('../utils/runRouter');
var ActiveRouteHandler = require('../components/ActiveRouteHandler');
var ActiveState = require('../mixins/ActiveState');
var testLocation = require('../locations/TestLocation');

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
        var div = document.createElement('div');
        var location = testLocation('/redirect');
        Router.run(routes, location, function (Handler, state) {
          React.render(Handler(), div, function () {
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

  describe('query params', function() {
    var Foo = React.createClass({
      render: function () { return React.DOM.div({}, this.props.query); }
    });

    it('renders with query params', function(done) {
      var routes = Route({handler: Foo, path: '/'});
      Router.run(routes, '/?foo=bar', function (Handler, state) {
        var html = React.renderToString(Handler({query: state.activeQuery.foo}));
        expect(html).toMatch(/bar/);
        done();
      });
    });
  });

  describe('transitionFrom', function() {
    it('sends a rendered component', function(done) {
      var div = document.createElement('div');

      var Foo = React.createClass({
        render: function () {
          return React.DOM.div({}, React.createElement(ActiveRouteHandler));
        }
      });

      var Bar = React.createClass({
        statics: {
          willTransitionFrom: function(transition, component) {
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

      var location = testLocation('/bar');

      Router.run(routes, location, function (Handler, state) {
        React.render(React.createElement(Handler), div, function() {
          location.push('/baz');
        });
      });
    });


  });

});
