var assert = require('assert');
var expect = require('expect');
var React = require('react/addons');
var ReactTestUtils = React.addons.TestUtils;
var Routes = require('../../components/Routes');
var Route = require('../../components/Route');

describe('ActiveContext', function () {

  var App = React.createClass({
    render: function () {
      return null;
    }
  });

  describe('when a route is active', function () {
    describe('and it has no params', function () {
      var component;
      beforeEach(function (done) {
        component = ReactTestUtils.renderIntoDocument(
          Routes({ location: 'none' },
            Route({ name: 'home', handler: App })
          )
        );

        component.dispatch('/home', function (error, abortReason, nextState) {
          expect(error).toBe(null);
          expect(abortReason).toBe(null);
          component.setState(nextState, done);
        });
      });

      afterEach(function () {
        React.unmountComponentAtNode(component.getDOMNode());
      });

      it('is active', function () {
        assert(component.isActive('home'));
      });
    });

    describe('and the right params are given', function () {
      var component;
      beforeEach(function (done) {
        component = ReactTestUtils.renderIntoDocument(
          Routes({ location: 'none' },
            Route({ name: 'products', path: '/products/:id/:variant', handler: App })
          )
        );

        component.dispatch('/products/123/456?search=abc&limit=789', function (error, abortReason, nextState) {
          expect(error).toBe(null);
          expect(abortReason).toBe(null);
          component.setState(nextState, done);
        });
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
          assert(component.isActive('products', { id: 123 }, { search: 'abc' }));
        });
      });

      describe('but the query does not match', function () {
        it('is not active', function () {
          assert(component.isActive('products', { id: 123 }, { search: 'def' }) === false);
        });
      });
    });

    describe('and the wrong params are given', function () {
      var component;
      beforeEach(function (done) {
        component = ReactTestUtils.renderIntoDocument(
          Routes({ location: 'none' },
            Route({ name: 'products', path: '/products/:id', handler: App })
          )
        );

        component.dispatch('/products/123', function (error, abortReason, nextState) {
          expect(error).toBe(null);
          expect(abortReason).toBe(null);
          component.setState(nextState, done);
        });
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
