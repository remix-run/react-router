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
var PathStore = require('../modules/stores/PathStore');

beforeEach(function () {
  PathStore.setup(MemoryLocation);
  PathStore.push('/');
});

afterEach(function () {
  PathStore.teardown();
});
