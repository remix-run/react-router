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
        expect(output).toMatch(/^<b data-reactid="[\.a-z0-9]+">Hello mjackson!<\/b>/);
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
    var html, div, routes;

    var Home = React.createClass({
      statics: {
        getAsyncProps: function() {
          return {
            name: Promise.resolve('skillet')
          };
        }
      },

      render: function () {
        return React.DOM.div(null, 'Hello ' + this.props.name + '!');
      }
    });

    beforeEach(function(done) {
      routes = Routes({}, Route({name: 'root', path: '/', handler: Home}));
      div = document.createElement('div');
      document.body.appendChild(div);

      Router.renderRoutesToString(routes, '/', function(err, ar, html) {
        fakeServerRender(html);
        done();
      });
    });

    afterEach(function() {
      delete window.__REACT_ROUTER_ASYNC_PROPS__;
      React.unmountComponentAtNode(div);
      document.body.removeChild(div);
    });

    function renderClient(done) {
      React.renderComponent(routes, div, done);
    }

    function fakeServerRender(html) {
      div.innerHTML = html;
      executeScript(div);
    }

    it('does not blow away HTML with async route props', function (done) {
      assert.ok(div.querySelector('[data-react-checksum]'));
      assert.ok(div.innerHTML.match('skillet'));
      renderClient(function() {
        assert.ok(div.querySelector('[data-react-checksum]'));
        assert.ok(div.innerHTML.match('skillet'));
        done();
      });
    });

    it('deletes server rendered async props after first use', function (done) {
      // delete the props so that navigating to the same route with different
      // params doesn't continually return the same data.
      expect(window.__REACT_ROUTER_ASYNC_PROPS__.root).toEqual({name: 'skillet'});
      renderClient(function() {
        expect(window.__REACT_ROUTER_ASYNC_PROPS__.root).toEqual(undefined);
        done();
      });
    });
  });
});

function executeScript(node) {
  // inserting script tags with innerHTML doesn't execute them, so we have to
  // foce it here, when you're actually rendering on a server the script will
  // execute normally. Any chance to use eval you should take it.
  eval(node.querySelector('script').textContent);
}
