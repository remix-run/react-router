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

    function redirect(transition) { transition.redirect('/foo'); }

    function returnNull() { return null; }

    var To = React.createClass({
      statics: { willTransitionTo: redirect },
      render: returnNull 
    });

    var From = React.createClass({
      statics: { willTransitionFrom: redirect },
      render: returnNull 
    });

    var Foo = React.createClass({
      render: function () { return React.DOM.div('foo'); }
    });

    var routes = [
      Route({path: '/from', handler: From}),
      Route({path: '/to', handler: To}),
      Route({path: '/foo', handler: Foo})
    ];

    describe('redirect', function () {
      it('in willTransitionTo', function (done) {
        assert.ok(true); done();
        // TODO: figure out how to test transitions and such
        //var div = document.createElement('div');
        //Router.run(routes, function (App, state) {
          //React.render(App(), div, function () {
            //expect(div.innerHTML).toMatch(/foo/);
            //setTimeout(done, 1000);
          //});
        //});
      });

      it('in willTransitionFrom');
    });

    describe('abort', function () {
      it('in willTransitionTo');
      it('in willTransitionFrom');
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
          return React.DOM.div({}, ActiveRouteHandler());
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

      var location = testLocation('/bar');
      var routes = (
        Route({handler: Foo, path: '/'},
          Route({name: 'bar', handler: Bar}),
          Route({name: 'baz', handler: Bar})
        )
      );
      Router.run(routes, location, function (Handler, state) {
        React.render(Handler(), div, function() {
          location.push('/baz');
        });
      });
    });
  });

});
