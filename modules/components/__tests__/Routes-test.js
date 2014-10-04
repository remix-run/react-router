var assert = require('assert');
var expect = require('expect');
var React = require('react/addons');
var ReactTestUtils = React.addons.TestUtils;
var PathStore = require('../../stores/PathStore');
var Routes = require('../Routes');
var Route = require('../Route');

function getRootMatch(matches) {
  return matches[matches.length - 1];
}

describe('A Routes', function () {

  var App = React.createClass({
    render: function () {
      return null;
    }
  });

  describe('that matches a URL', function () {
    var component;
    beforeEach(function () {
      component = ReactTestUtils.renderIntoDocument(
        Routes(null,
          Route({ handler: App },
            Route({ path: '/a/b/c', handler: App })
          )
        )
      );    
    });

    afterEach(function () {
      React.unmountComponentAtNode(component.getDOMNode());
      // For some reason unmountComponentAtNode doesn't call componentWillUnmount :/
      PathStore.removeAllChangeListeners();
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
          Route({ handler: App },
            Route({ path: '/posts/:id/edit', handler: App })
          )
        )
      );    
    });

    afterEach(function () {
      React.unmountComponentAtNode(component.getDOMNode());
      // For some reason unmountComponentAtNode doesn't call componentWillUnmount :/
      PathStore.removeAllChangeListeners();
    });

    it('returns an array with the correct params', function () {
      var matches = component.match('/posts/abc/edit');
      assert(matches);
      expect(matches.length).toEqual(2);

      var rootMatch = getRootMatch(matches);
      expect(rootMatch.params).toEqual({ id: 'abc' });
    });
  });

});
