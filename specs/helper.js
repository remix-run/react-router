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

var transitionTo = require('../modules/actions/LocationActions').transitionTo;
var MemoryLocation = require('../modules/locations/MemoryLocation');
var PathStore = require('../modules/stores/PathStore');

beforeEach(function () {
  PathStore.setup(MemoryLocation);
  transitionTo('/');
});

afterEach(function () {
  PathStore.teardown();
});
