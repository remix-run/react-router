import NavigationTypes from './NavigationTypes';

/**
 * A Location answers two important questions:
 *
 * 1. Where am I?
 * 2. How did I get here?
 */
class Location {

  constructor(path, query, navigationType, key, scrollPosition) {
    this.path = path;
    this.query = query || null;
    this.navigationType = navigationType || NavigationTypes.POP;
    this.key = key || null;
    this.scrollPosition = scrollPosition || null;
  }

  toJSON() {
    return {
      path: this.path,
      query: this.query,
      navigationType: this.navigationType,
      key: this.key
    };
  }

}

module.exports = Location;
