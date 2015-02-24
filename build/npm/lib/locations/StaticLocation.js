"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var invariant = require("react/lib/invariant");

function throwCannotModify() {
  invariant(false, "You cannot modify a static location");
}

/**
 * A location that only ever contains a single path. Useful in
 * stateless environments like servers where there is no path history,
 * only the path that was used in the request.
 */

var StaticLocation = (function () {
  function StaticLocation(path) {
    _classCallCheck(this, StaticLocation);

    this.path = path;
  }

  _prototypeProperties(StaticLocation, null, {
    getCurrentPath: {
      value: function getCurrentPath() {
        return this.path;
      },
      writable: true,
      configurable: true
    },
    toString: {
      value: function toString() {
        return "<StaticLocation path=\"" + this.path + "\">";
      },
      writable: true,
      configurable: true
    }
  });

  return StaticLocation;
})();

// TODO: Include these in the above class definition
// once we can use ES7 property initializers.
StaticLocation.prototype.push = throwCannotModify;
StaticLocation.prototype.replace = throwCannotModify;
StaticLocation.prototype.pop = throwCannotModify;

module.exports = StaticLocation;