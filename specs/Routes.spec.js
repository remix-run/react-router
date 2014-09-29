require('./helper');
var Route = require('../modules/components/Route');
var Routes = require('../modules/components/Routes');
var RouteStore = require('../modules/stores/RouteStore');

describe('a Routes', function () {

  describe('when a transition is aborted', function () {
    it('triggers onAbortedTransition', function (done) {
      var App = React.createClass({
        statics: {
          willTransitionTo: function (transition) {
            transition.abort();
          }
        },
        render: function () {
          return React.DOM.div();
        }
      });

      function handleAbortedTransition(transition) {
        assert(transition);
        done();
      }

      var routes = ReactTestUtils.renderIntoDocument(
        Routes({ onAbortedTransition: handleAbortedTransition },
          Route({ handler: App })
        )
      );
    });
  });

  describe('when there is an error in a transition hook', function () {
    it('triggers onTransitionError', function (done) {
      var App = React.createClass({
        statics: {
          willTransitionTo: function (transition) {
            throw new Error('boom!');
          }
        },
        render: function () {
          return React.DOM.div();
        }
      });

      function handleTransitionError(error) {
        assert(error);
        expect(error.message).toEqual('boom!');
        done();
      }

      var routes = ReactTestUtils.renderIntoDocument(
        Routes({ onTransitionError: handleTransitionError },
          Route({ handler: App })
        )
      );
    });
  });
  
  describe('when unmounted', function() {
    it('unregisters all routes', function() {
      var App = React.createClass({
        render: function () {
          return React.DOM.div();
        }
      });

      // Cannot unmount with .renderIntoDocument
      var container = document.createElement('div');
      var routes = React.renderComponent(
        Routes(
          null, Route({ path: '/', name: 'main', handler: App })
        )
      , container);
      
      expect(RouteStore.getRouteByName('main')).toNotBe(null);
      
      React.unmountComponentAtNode(container);
      
      expect(RouteStore.getRouteByName('main')).toBe(null);
    });
  });

});
