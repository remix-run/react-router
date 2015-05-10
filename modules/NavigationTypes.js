var keyMirror = require('keymirror');

var NavigationTypes = keyMirror({

  /**
   * Indicates that navigation was caused by a call to history.push.
   */
  PUSH: null,

  /**
   * Indicates that navigation was caused by a call to history.replace.
   */
  REPLACE: null,

  /**
   * Indicates that navigation was caused by some other action such
   * as using a browser's back/forward buttons and/or manually manipulating
   * the URL in a browser's location bar. This is the default.
   *
   * See https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onpopstate
   * for more information.
   */
  POP: null

});

module.exports = NavigationTypes;
