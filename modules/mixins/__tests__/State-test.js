var assert = require('assert');
var expect = require('expect');
var React = require('react/addons');
var Router = require('../../index');
var Route = require('../../elements/Route');
var TestLocation = require('../../locations/TestLocation');
var { Foo } = require('../../__tests__/TestHandlers');

describe('State', function () {

  describe('when a route is active', function () {
    describe('and it has no params', function () {
      it('is active', function (done) {
        var div = document.createElement('div');
        TestLocation.history = ['/foo'];
        var routes = (
          <Route name="foo" handler={Foo}/>
        );
        Router.run(routes, TestLocation, function (Handler) {
          React.render(<Handler/>, div, function () {
            assert(this.isActive('foo'));
            done();
          });
        });
      });
    });

    describe('and the right params are given', function () {
      var component;
      var div = document.createElement('div');
      var routes = <Route name="products" path="/products/:id/:variant" handler={Foo}/>

      beforeEach(function (done) {
        TestLocation.history = ['/products/123/456?search=abc&limit=789'];
        Router.run(routes, TestLocation, function (Handler) {
          React.render(<Handler/>, div, function () {
            component = this;
            done();
          });
        });
      });

      afterEach(function () {
        React.unmountComponentAtNode(div);
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

      describe('and the wrong params are given', function () {
        it('is not active', function () {
          assert(component.isActive('products', { id: 345 }) === false);
        });
      });

    });
  });
});
