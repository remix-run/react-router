var NavigationTypes = require('./NavigationTypes');
var { getPathname, getQueryString, getQuery } = require('./PathUtils');

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
    return getPathname(this.path);
  }

  getQueryString() {
    return getQueryString(this.path);
  }

  getQuery(options) {
    return getQuery(this.path, options);
  }

}

module.exports = Location;
