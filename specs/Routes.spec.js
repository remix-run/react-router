require('./helper');
var Route = require('../modules/components/Route');
var Routes = require('../modules/components/Routes');

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

  describe('when there is a change in active state', function () {
    it('triggers onActiveStateChange', function (done) {
      var App = React.createClass({
        render: function () {
          return React.DOM.div();
        }
      });

      function handleActiveStateChange(state) {
        assert(state);
        done();
      }

      var routes = ReactTestUtils.renderIntoDocument(
        Routes({ onActiveStateChange: handleActiveStateChange },
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

});
