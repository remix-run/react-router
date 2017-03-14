"use strict";

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// Simple cache - NEW cached items are added to cachedKeys array. When cache is
// full, oldest key is removed from array and item is removed from cache

var DEFAULT_OPTIONS = {
  limit: 200
};

var MatcherCache = function () {
  function MatcherCache() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, MatcherCache);

    this.cache = {};
    this.cachedKeys = [];

    var mergedOptions = _extends({}, DEFAULT_OPTIONS, options);
    this.options = mergedOptions;
  }

  MatcherCache.prototype.set = function set(key, value) {
    // If this key is not cached add key to cachedKeys array
    if (this.cache[key] === undefined) {
      this.cachedKeys.push(key);
    }
    this.cache[key] = value;
    this.checkCacheLimit();
  };

  MatcherCache.prototype.get = function get(key) {
    return this.cache[key];
  };

  MatcherCache.prototype.checkCacheLimit = function checkCacheLimit() {
    // Clear a cache item if we are over limit
    if (this.cachedKeys.length > this.options.limit) {
      var keyToUncache = this.cachedKeys.shift();
      delete this.cache[keyToUncache];
    }
  };

  return MatcherCache;
}();

exports.default = MatcherCache;