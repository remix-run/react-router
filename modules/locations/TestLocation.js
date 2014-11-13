var LocationActions = require('../actions/LocationActions');

var _onChange;

var TestLocation = {

  history: [],

  setup: function (onChange) {
    _onChange = onChange;
  },

  push: function (path) {
    TestLocation.history.push(path);

    _onChange({
      path: path,
      type: LocationActions.PUSH
    });
  },

  replace: function (path) {
    TestLocation.history[TestLocation.history.length - 1] = path;

    _onChange({
      path: path,
      type: LocationActions.REPLACE
    });
  },

  pop: function () {
    TestLocation.history.pop();

    _onChange({
      path: TestLocation.getCurrentPath(),
      type: LocationActions.POP
    });
  },

  getCurrentPath: function () {
    return TestLocation.history[TestLocation.history.length - 1];
  },

  toString: function () {
    return '<TestLocation>';
  }

};

module.exports = TestLocation;
