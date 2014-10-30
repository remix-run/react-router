var assert = require('assert');
var expect = require('expect');
var React = require('react');
var Route = require('../../components/Route');
var Router = require('../../Router');
var runRouter = require('../runRouter');
var ActiveRouteHandler = require('../../components/ActiveRouteHandler');

describe('runRouter', function () {

  var Nested = React.createClass({
    render: function() {
      return React.DOM.div({},
        React.DOM.h1({}, 'hello'),
        ActiveRouteHandler()
      );
    }
  });

  var Echo = React.createClass({
    render: function() { return React.DOM.div({}, this.props.name); }
  });

  var RPFlo = React.createClass({
    render: function() { return React.DOM.div({}, 'rpflo'); }
  });

  var MJ = React.createClass({
    render: function() { return React.DOM.div({}, 'mj'); }
  });

  it('matches a root route', function(done) {
    var router = new Router(Route({handler: Echo, path: '/'}));
    runRouter(router, '/', function(Handler, state) {
      // TODO: figure out why we're getting this warning here
      // WARN: 'Warning: You cannot pass children to a RouteHandler'
      var html = React.renderToString(Handler({name: 'ryan'}));
      expect(html).toMatch(/ryan/);
      done();
    });
  });

  it('matches an array of routes', function(done) {
    var router = new Router([
      Route({handler: RPFlo, path: '/rpflo'}),
      Route({handler: MJ, path: '/mj'})
    ]);
    runRouter(router, '/mj', function(Handler, state) {
      var html = React.renderToString(Handler());
      expect(html).toMatch(/mj/);
      done();
    });
  });

  it('matches nested routes', function(done) {
    var router = new Router(
      Route({handler: Nested, path: '/'},
        Route({handler: MJ, path: '/mj'})
      )
    );
    runRouter(router, '/mj', function(Handler, state) {
      var html = React.renderToString(Handler());
      expect(html).toMatch(/hello/);
      expect(html).toMatch(/mj/);
      done();
    });
  });

  describe('RouteHandler', function() {
    it('throws if called after the router transitions to a new state');
  });

});
