var assert = require('assert');
var React = require('react/addons');
var ReactTestUtils = React.addons.TestUtils;
var Route = require('../../components/Route');
var ActiveContext = require('../ActiveContext');

describe('ActiveContext', function () {

  var App = React.createClass({
    mixins: [ ActiveContext ],
    render: function () {
      return null;
    }
  });

  describe('when a route is active', function () {
    var route;
    beforeEach(function () {
      route = Route({ name: 'products', handler: App });
    });

    describe('and it has no params', function () {
      var component;
      beforeEach(function () {
        component = ReactTestUtils.renderIntoDocument(
          App({
            initialActiveRoutes: [ route ]
          })
        );
      });

      afterEach(function () {
        React.unmountComponentAtNode(component.getDOMNode());
      });

      it('is active', function () {
        assert(component.isActive('products'));
      });
    });

    describe('and the right params are given', function () {
      var component;
      beforeEach(function () {
        component = ReactTestUtils.renderIntoDocument(
          App({
            initialActiveRoutes: [ route ],
            initialActiveParams: { id: '123', show: 'true', variant: 456 },
            initialActiveQuery: { search: 'abc', limit: 789 }
          })
        );
      });

      afterEach(function () {
        React.unmountComponentAtNode(component.getDOMNode());
      });

      describe('and no query is used', function () {
        it('is active', function () {
          assert(component.isActive('products', { id: 123, variant: '456' }));
        });
      });

      describe('and a matching query is used', function () {
        it('is active', function () {
          assert(component.isActive('products', { id: 123 }, { search: 'abc', limit: '789' }));
        });
      });

      describe('but the query does not match', function () {
        it('is not active', function () {
          assert(component.isActive('products', { id: 123 }, { search: 'def', limit: '123' }) === false);
        });
      });
    });

    describe('and the wrong params are given', function () {
      var component;
      beforeEach(function () {
        component = ReactTestUtils.renderIntoDocument(
          App({
            initialActiveRoutes: [ route ],
            initialActiveParams: { id: 123 }
          })
        );
      });

      afterEach(function () {
        React.unmountComponentAtNode(component.getDOMNode());
      });

      it('is not active', function () {
        assert(component.isActive('products', { id: 345 }) === false);
      });
    });
  });

});
