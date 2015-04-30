var NavigationTypes = require('./NavigationTypes');

class Location {

  constructor(path, navigationType) {
    this.path = path;
    this.navigationType = navigationType || NavigationTypes.POP;
  }

}

module.exports = Location;
