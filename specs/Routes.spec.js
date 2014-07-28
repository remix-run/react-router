require('./helper');
var URLStore = require('../modules/stores/URLStore');
var Route = require('../modules/components/Route');
var Routes = require('../modules/components/Routes');

describe('Routes', function() {

  afterEach(function() {
    URLStore.teardown();
    window.location.hash = '';
  });

  describe('a change in active state', function () {
    it('triggers onActiveStateChange', function (done) {
      var App = React.createClass({
        render: function () {
          return React.DOM.div();
        }
      });

      function handleActiveStateChange(state) {
        assert(state);
        removeComponent(routes);
        done();
      }

      var routes = renderComponent(
        Routes({ onActiveStateChange: handleActiveStateChange },
          Route({ handler: App })
        )
      );
    });
  });

  describe('a cancelled transition', function () {
    it('triggers onCancelledTransition', function (done) {
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

      function handleCancelledTransition(transition) {
        assert(transition);
        removeComponent(routes);
        done();
      }

      var routes = renderComponent(
        Routes({ onCancelledTransition: handleCancelledTransition },
          Route({ handler: App })
        )
      );
    });
  });

  describe('an error in a transition hook', function () {
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
        removeComponent(routes);
        done();
      }

      var routes = renderComponent(
        Routes({ onTransitionError: handleTransitionError },
          Route({ handler: App })
        )
      );
    });
  });

});
