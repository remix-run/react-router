require('./helper');
var Route = require('../modules/components/Route');
var Routes = require('../modules/components/Routes');

describe('a Routes', function () {

  describe('when transition is successful', function () {
    it('triggers onPathChange', function (done) {
      var App = React.createClass({
        render: function () {
          return React.DOM.div();
        }
      });

      function handlePathChange(path) {
        expect(path).toEqual('/');
        done();
      }

      var routes = ReactTestUtils.renderIntoDocument(
        Routes({ onPathChange: handlePathChange },
          Route({ handler: App })
        )
      );
    });
  });

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

});
