"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

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

  _createClass(StaticLocation, {
    getCurrentPath: {
      value: function getCurrentPath() {
        return this.path;
      }
    },
    toString: {
      value: function toString() {
        return "<StaticLocation path=\"" + this.path + "\">";
      }
    }
  });

  return StaticLocation;
})();

// TODO: Include these in the above class definition
// once we can use ES7 property initializers.
// https://github.com/babel/babel/issues/619

StaticLocation.prototype.push = throwCannotModify;
StaticLocation.prototype.replace = throwCannotModify;
StaticLocation.prototype.pop = throwCannotModify;

module.exports = StaticLocation;