import NavigationTypes from './NavigationTypes';

/**
 * A Location answers two important questions:
 *
 * 1. Where am I?
 * 2. How did I get here?
 */
class Location {

  static isLocation(object) {
    return object instanceof Location;
  }

  static create(object) {
    if (Location.isLocation(object))
      return object;

    if (typeof object === 'string')
      return new Location(object);

    if (object && object.path)
      return new Location(object.path, object.key, object.navigationType, object.scrollPosition);

    throw new Error('Unable to create a Location from ' + object);
  }

  constructor(path, key=null, navigationType=NavigationTypes.POP, scrollPosition=null) {
    this.path = path;
    this.key = key;
    this.navigationType = navigationType;
    this.scrollPosition = scrollPosition;
  }

}

module.exports = Location;
