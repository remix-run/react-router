var keyMirror = require('react/lib/keyMirror');

var ActionTypes = keyMirror({
  SETUP: null,
  PUSH: null,
  REPLACE: null,
  POP: null,
  UPDATE_SCROLL: null
});

module.exports = ActionTypes;
