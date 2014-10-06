var assert = require('assert');
var expect = require('expect');
var React = require('react/addons');
var ReactTestUtils = React.addons.TestUtils;
var Routes = require('../Routes');
var Route = require('../Route');

function getRootMatch(matches) {
  return matches[matches.length - 1];
}

var NullHandler = React.createClass({
  render: function () {
    return null;
  }
});

describe('A Routes', function () {

  describe('that matches a URL', function () {
    var component;
    beforeEach(function () {
      component = ReactTestUtils.renderIntoDocument(
        Routes(null,
          Route({ handler: NullHandler },
            Route({ path: '/a/b/c', handler: NullHandler })
          )
        )
      );    
    });

    afterEach(function () {
      React.unmountComponentAtNode(component.getDOMNode());
    });

    it('returns an array', function () {
      var matches = component.match('/a/b/c');
      assert(matches);
      expect(matches.length).toEqual(2);

      var rootMatch = getRootMatch(matches);
      expect(rootMatch.params).toEqual({});
    });
  });

  describe('that matches a URL with dynamic segments', function () {
    var component;
    beforeEach(function () {
      component = ReactTestUtils.renderIntoDocument(
        Routes(null,
          Route({ handler: NullHandler },
            Route({ path: '/posts/:id/edit', handler: NullHandler })
          )
        )
      );    
    });

    afterEach(function () {
      React.unmountComponentAtNode(component.getDOMNode());
    });

    it('returns an array with the correct params', function () {
      var matches = component.match('/posts/abc/edit');
      assert(matches);
      expect(matches.length).toEqual(2);

      var rootMatch = getRootMatch(matches);
      expect(rootMatch.params).toEqual({ id: 'abc' });
    });
  });


  describe('when a transition is aborted', function () {
    it('triggers onAbortedTransition', function (done) {
      var AbortHandler = React.createClass({
        statics: {
          willTransitionTo: function (transition) {
            transition.abort();
          }
        },
        render: function () {
          return null;
        }
      });

      function handleAbortedTransition(transition) {
        assert(transition);
        done();
      }

      ReactTestUtils.renderIntoDocument(
        Routes({ onAbortedTransition: handleAbortedTransition },
          Route({ handler: AbortHandler })
        )
      );
    });
  });

  describe('when there is an error in a transition hook', function () {
    it('triggers onTransitionError', function (done) {
      var ErrorHandler = React.createClass({
        statics: {
          willTransitionTo: function (transition) {
            throw new Error('boom!');
          }
        },
        render: function () {
          return null;
        }
      });

      function handleTransitionError(error) {
        assert(error);
        expect(error.message).toEqual('boom!');
        done();
      }

      ReactTestUtils.renderIntoDocument(
        Routes({ onTransitionError: handleTransitionError },
          Route({ handler: ErrorHandler })
        )
      );
    });
  });

});
