var NavigationTypes = require('./NavigationTypes');
var PathUtils = require('./PathUtils');

/**
 * A Location answers two important questions:
 *
 * 1. Where am I?
 * 2. How did I get here?
 */
class Location {

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

}

module.exports = Location;
