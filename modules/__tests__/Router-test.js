var assert = require('assert');
var expect = require('expect');
var React = require('react');
var Route = require('../components/Route');
var Router = require('../Router');
var runRouter = require('../utils/runRouter');
var ActiveRouteHandler = require('../components/ActiveRouteHandler');
var ActiveState = require('../mixins/ActiveState');

describe('Router', function () {
  describe('transitions', function() {

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
      render: function() { return React.DOM.div('foo'); }
    });

    var routes = [
      Route({path: '/from', handler: From}),
      Route({path: '/to', handler: To}),
      Route({path: '/foo', handler: Foo})
    ];

    describe('redirect', function() {
      it('in willTransitionTo', function(done) {
        assert.ok(true); done();
        // TODO: figure out how to test transitions and such
        //var div = document.createElement('div');
        //Router.run(routes, function(App, state) {
          //React.render(App(), div, function() {
            //expect(div.innerHTML).toMatch(/foo/);
            //setTimeout(done, 1000);
          //});
        //});
      });

      it('in willTransitionFrom');
    });

    describe('abort', function() {
      it('in willTransitionTo');
      it('in willTransitionFrom');
    });
  });
});
