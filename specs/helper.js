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

var ExecutionEnvironment = require('react/lib/ExecutionEnvironment');

// TODO: Use this as a guard for tests that require DOM.
__DOM__ = ExecutionEnvironment.canUseDOM;

if (__DOM__) {
  var ROOT_NODE = document.createElement('div');
  document.body.appendChild(ROOT_NODE);

  renderComponent = function (component) {
    return React.renderComponent(component, ROOT_NODE);
  };

  removeComponent = function (component) {
    React.unmountComponentAtNode(ROOT_NODE);
  };
}
