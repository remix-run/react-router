require('./helper');
var Route = require('../modules/Route');
var ActiveStore = require('../modules/stores/ActiveStore');

var App = React.createClass({
  displayName: 'App',
  render: function () {
    return React.DOM.div();
  }
});

describe('when a Route is active', function () {
  beforeEach(function () {
    Route.clearNamedRoutes();
  });

  describe('and it has no params', function () {
    beforeEach(function () {
      ActiveStore.update({
        routes: [ new Route({ name: 'products', handler: App }) ]
      });
    });

    it('is active', function () {
      assert(ActiveStore.isActive('products'));
    });
  });

  describe('and the right params are given', function () {
    beforeEach(function () {
      ActiveStore.update({
        routes: [ new Route({ name: 'products', handler: App }) ],
        params: { id: '123', show: 'true' },
        query: { search: 'abc' }
      });
    });

    describe('and no query is used', function () {
      it('is active', function () {
        assert(ActiveStore.isActive('products', { id: 123 }));
      });
    });

    describe('and a matching query is used', function () {
      it('is active', function () {
        assert(ActiveStore.isActive('products', { id: 123 }, { search: 'abc' }));
      });
    });

    describe('but the query does not match', function () {
      it('is not active', function () {
        refute(ActiveStore.isActive('products', { id: 123 }, { search: 'def' }));
      });
    });
  });

  describe('and the wrong params are given', function () {
    beforeEach(function () {
      ActiveStore.update({
        routes: [ new Route({ name: 'products', handler: App }) ],
        params: { id: 123 }
      });
    });

    it('is not active', function () {
      refute(ActiveStore.isActive('products', { id: 345 }));
    });
  });
});
