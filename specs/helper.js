assert = require('assert');
expect = require('expect');

refute = function (condition, message) {
  assert(!condition, message);
};

React = require('react/addons');
TestUtils = React.addons.TestUtils;
