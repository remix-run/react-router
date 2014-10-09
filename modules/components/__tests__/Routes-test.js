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
        Routes({ location: 'none' },
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
        Routes({ location: 'none' },
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

  describe('with `handlerProps`', function () {
    var component;
    var expectedResult = "passed in from handlerProps";


    beforeEach(function () {
      component = ReactTestUtils.renderIntoDocument(
        Routes({ handlerProps: { echo: expectedResult } },
          Route({ handler: NullHandler },
            Route({ handler: NullHandler })
          )
        )
      );
    });

    afterEach(function () {
      React.unmountComponentAtNode(component.getDOMNode());
    });

    it('returns an array with the correct params', function () {
      // component.props gives you <Routes>'s props
      // component.render().props appears to give you the deepest child's props
      // this is my first time unit testing a React component,
      // so please show me the right way to do this.  =)
      expect(component.render().props.echo).toEqual(expectedResult);
    });
  });
});
