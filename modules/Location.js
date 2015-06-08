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
      return new Location(null, object);

    if (object && object.path)
      return new Location(object.state, object.path, object.navigationType);

    throw new Error('Unable to create a Location from ' + object);
  }

  constructor(state, path, navigationType=NavigationTypes.POP) {
    this.state = state;
    this.path = path;
    this.navigationType = navigationType;
  }

}

export default Location;
