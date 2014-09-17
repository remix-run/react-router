require('./helper');
var Route = require('../modules/components/Route');
var ActiveDelegate = require('../modules/mixins/ActiveDelegate');

var App = React.createClass({
  displayName: 'App',
  mixins: [ ActiveDelegate ],
  getInitialState: function () {
    return this.props.initialState;
  },
  render: function () {
    return React.DOM.div();
  }
});

describe('when a Route is active', function () {
  var route;
  beforeEach(function () {
    route = Route({ name: 'products', handler: App });
  });

  describe('and it has no params', function () {
    var app;
    beforeEach(function () {
      app = ReactTestUtils.renderIntoDocument(
        App({
          initialState: {
            activeRoutes: [ route ]
          }
        })
      );
    });

    it('is active', function () {
      assert(app.isActive('products'));
    });
  });

  describe('and the right params are given', function () {
    var app;
    beforeEach(function () {
      app = ReactTestUtils.renderIntoDocument(
        App({
          initialState: {
            activeRoutes: [ route ],
            activeParams: { id: '123', show: 'true', variant: 456 },
            activeQuery: { search: 'abc', limit: 789 }
          }
        })
      );
    });

    describe('and no query is used', function () {
      it('is active', function () {
        assert(app.isActive('products', { id: 123, variant: '456' }));
      });
    });

    describe('and a matching query is used', function () {
      it('is active', function () {
        assert(app.isActive('products', { id: 123 }, { search: 'abc', limit: '789' }));
      });
    });

    describe('but the query does not match', function () {
      it('is not active', function () {
        refute(app.isActive('products', { id: 123 }, { search: 'def', limit: '123' }));
      });
    });
  });

  describe('and the wrong params are given', function () {
    var app;
    beforeEach(function () {
      app = ReactTestUtils.renderIntoDocument(
        App({
          initialState: {
            activeRoutes: [ route ],
            activeParams: { id: 123 }
          }
        })
      );
    });

    it('is not active', function () {
      refute(app.isActive('products', { id: 345 }));
    });
  });
});
