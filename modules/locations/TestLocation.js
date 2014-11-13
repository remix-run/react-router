var LocationActions = require('../actions/LocationActions');

var _listener;

function notifyChange(type) {
  if (_listener)
    _listener({ type: type, path: TestLocation.getCurrentPath() });
}

var TestLocation = {

  history: [],

  addChangeListener: function (listener) {
    // TestLocation only ever supports a single listener at a time.
    _listener = listener;
  },

  push: function (path) {
    TestLocation.history.push(path);
    notifyChange(LocationActions.PUSH);
  },

  replace: function (path) {
    TestLocation.history[TestLocation.history.length - 1] = path;
    notifyChange(LocationActions.REPLACE);
  },

  pop: function () {
    TestLocation.history.pop();
    notifyChange(LocationActions.POP);
  },

  getCurrentPath: function () {
    return TestLocation.history[TestLocation.history.length - 1];
  },

  toString: function () {
    return '<TestLocation>';
  }

};

module.exports = TestLocation;
