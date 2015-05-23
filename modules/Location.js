import NavigationTypes from './NavigationTypes';

/**
 * A Location answers two important questions:
 *
 * 1. Where am I?
 * 2. How did I get here?
 */
class Location {

  constructor(path, query, navigationType) {
    this.navigationType = navigationType || NavigationTypes.POP;
    this.query = query || null;
    this.path = path;
  }

  toJSON() {
    return {
      path: this.path,
      query: this.query,
      navigationType: this.navigationType
    };
  }

}

module.exports = Location;
