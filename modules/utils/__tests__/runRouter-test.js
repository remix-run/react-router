var assert = require('assert');
var expect = require('expect');
var React = require('react');
var Route = require('../../components/Route');
var Router = require('../../Router');
var runRouter = require('../runRouter');


describe('runRouter', function () {

  var Home = React.createClass({
    render: function() {
      return React.DOM.div({}, this.props.name);
    }
  });

  var RPFlo = React.createClass({
    render: function() {
      return React.DOM.div({}, 'rpflo');
    }
  });

  var MJ = React.createClass({
    render: function() {
      return React.DOM.div({}, 'mj');
    }
  });

  it('matches a root route', function(done) {
    var router = new Router(Route({handler: Home, path: '/'}));
    runRouter(router, '/', function(Handler, state) {
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



});
