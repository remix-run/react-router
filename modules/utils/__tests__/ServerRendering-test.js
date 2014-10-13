var assert = require('assert');
var expect = require('expect');
var React = require('react');
var Link = require('../../components/Link');
var Router = require('../../index');
var Routes = require('../../components/Routes');
var Route = require('../../components/Route');
var ServerRendering = require('../ServerRendering');
var Promise = require('../Promise');

describe('ServerRendering', function () {

  describe('renderRoutesToMarkup', function () {
    describe('a very simple case', function () {
      var Home = React.createClass({
        render: function () {
          return React.DOM.b(null, 'Hello ' + this.props.params.username + '!');
        }
      });

      var output;
      beforeEach(function (done) {
        var routes = Routes(null,
          Route({ path: '/home/:username', handler: Home })
        );

        ServerRendering.renderRoutesToStaticMarkup(routes, '/home/mjackson', function (error, abortReason, markup) {
          assert(error == null);
          assert(abortReason == null);
          output = markup;
          done();
        });
      });

      it('has the correct output', function () {
        expect(output).toMatch(/^<b data-reactid="[\.a-z0-9]+">Hello mjackson!<\/b>$/);
      });
    });

    describe('an embedded <Link> to the current route', function () {
      var Home = React.createClass({
        render: function () {
          return Link({ to: 'home', params: { username: 'mjackson' } }, 'Hello ' + this.props.params.username + '!');
        }
      });

      var output;
      beforeEach(function (done) {
        var routes = Routes(null,
          Route({ name: 'home', path: '/home/:username', handler: Home })
        );

        ServerRendering.renderRoutesToStaticMarkup(routes, '/home/mjackson', function (error, abortReason, markup) {
          assert(error == null);
          assert(abortReason == null);
          output = markup;
          done();
        });
      });

      it('has the correct output', function () {
        expect(output).toMatch(/^<a href="\/home\/mjackson" class="active" data-reactid="[\.a-z0-9]+">Hello mjackson!<\/a>$/);
      });
    });

    describe('when the transition is aborted', function () {
      var Home = React.createClass({
        statics: {
          willTransitionTo: function (transition) {
            transition.abort({ status: 403 });
          }
        },
        render: function () {
          return null;
        }
      });

      var reason;
      beforeEach(function (done) {
        var routes = Routes(null,
          Route({ name: 'home', path: '/home/:username', handler: Home })
        );

        ServerRendering.renderRoutesToStaticMarkup(routes, '/home/mjackson', function (error, abortReason) {
          assert(error == null);
          reason = abortReason;
          done();
        });
      });

      it('gives the reason in the callback', function () {
        assert(reason);
        expect(reason.status).toEqual(403);
      });
    });

    describe('when there is an error performing the transition', function () {
      var Home = React.createClass({
        statics: {
          willTransitionTo: function (transition) {
            throw 'boom!';
          }
        },
        render: function () {
          return null;
        }
      });

      var error;
      beforeEach(function (done) {
        var routes = Routes(null,
          Route({ name: 'home', path: '/home/:username', handler: Home })
        );

        ServerRendering.renderRoutesToStaticMarkup(routes, '/home/mjackson', function (e, abortReason) {
          assert(abortReason == null);
          error = e;
          done();
        });
      });

      it('gives the reason in the callback', function () {
        expect(error).toEqual('boom!');
      });
    });
  });

  describe('renderRoutesToString', function () {
    var Home = React.createClass({
      render: function () {
        return React.DOM.b(null, 'Hello ' + this.props.params.username + '!');
      }
    });

    var output;
    beforeEach(function (done) {
      var routes = Routes(null,
        Route({ path: '/home/:username', handler: Home })
      );

      ServerRendering.renderRoutesToString(routes, '/home/mjackson', function (error, abortReason, string) {
        assert(error == null);
        assert(abortReason == null);
        output = string;
        done();
      });
    });

    it('has the correct output', function () {
      expect(output).toMatch(/^<b data-reactid="[\.a-z0-9]+" data-react-checksum="\d+">Hello mjackson!<\/b>$/);
    });
  });

  describe('renderRoutesToString with async route props', function () {
    var div, FAKE_ENV, serverProps;

    var Home = React.createClass({
      statics: {
        getRouteProps: function() {
          return {
            name: FAKE_ENV === 'server' ?
              Promise.resolve('skillet') :
              serverProps.root.name
          };
        }
      },

      render: function () {
        return React.DOM.div(null, 'Hello ' + this.props.name + '!');
      }
    });

    function switchToClient() {
      FAKE_ENV = 'client';
    }

    beforeEach(function() {
      FAKE_ENV = 'server';
      serverProps = {};
      div = document.createElement('div');
      document.body.appendChild(div);
    });

    afterEach(function() {
      document.body.removeChild(div);
    });

    it('does not blow away HTML with async route props', function (done) {
      var routes = Routes({}, Route({name: 'root', path: '/', handler: Home}));
      Router.renderRoutesToString(routes, '/', function(err, ar, html, propData) {
        serverProps = propData;
        div.innerHTML = html;
        assert.ok(div.querySelector('[data-react-checksum]'));
        assert.ok(div.innerHTML.match('skillet'));
        switchToClient();
        React.renderComponent(routes, div, function() {
          assert.ok(div.querySelector('[data-react-checksum]'));
          assert.ok(div.innerHTML.match('skillet'));
          React.unmountComponentAtNode(div);
          done();
        });
      });
    });
  });
});
