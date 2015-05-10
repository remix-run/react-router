var NavigationTypes = require('./NavigationTypes');
var PathUtils = require('./PathUtils');

/**
 * A Location answers two important questions:
 *
 * 1. Where am I?
 * 2. How did I get here?
 */
class Location {

  /**
   * Revives the location from its serialized form.
   * Use `Location.revive` as a second argument to `JSON.parse`.
   *
   *   var serialized = JSON.stringify(location);
   *   var deserialized = JSON.parse(serialized, Location.revive);
   *
   */
  static revive(key, value) {
    if (key === '') {
      return new Location(value.path, value.navigationType);
    } else {
      return value;
    }
  }

  constructor(path, navigationType) {
    this.path = path;
    this.navigationType = navigationType || NavigationTypes.POP;
  }

  getPathname() {
    return PathUtils.getPathname(this.path);
  }

  getQueryString() {
    return PathUtils.getQueryString(this.path);
  }

  getQuery(options) {
    return PathUtils.getQuery(this.path, options);
  }

  toJSON() {
    return {
      path: this.path,
      navigationType: this.navigationType
    };
  }

}

module.exports = Location;
