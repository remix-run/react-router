assert = require('assert');
expect = require('expect');
React = require('react/addons');
ReactTestUtils = React.addons.TestUtils;

refute = function (condition, message) {
  assert(!condition, message);
};

var RouteStore = require('../modules/stores/RouteStore');

beforeEach(function () {
  RouteStore.unregisterAllRoutes();
});

var MemoryLocation = require('../modules/locations/MemoryLocation');
var ScrollToTopStrategy = require('../modules/strategies/ScrollToTopStrategy');
var LocationActions = require('../modules/actions/LocationActions');
var ScrollStore = require('../modules/stores/ScrollStore');

beforeEach(function () {
  ScrollStore.setup(ScrollToTopStrategy);
  LocationActions.setup(MemoryLocation);
  LocationActions.transitionTo('/');
});

afterEach(function () {
  ScrollStore.teardown();
  LocationActions.teardown();
});
