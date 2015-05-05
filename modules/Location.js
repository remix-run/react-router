var NavigationTypes = require('./NavigationTypes');
var { getPathname, getQueryString, getQuery } = require('./PathUtils');

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
