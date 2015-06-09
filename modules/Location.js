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
      return new Location(object.path, object.state, object.navigationType);

    throw new Error('Unable to create a Location from ' + object);
  }

  constructor(path, state=null, navigationType=NavigationTypes.POP) {
    this.path = path;
    this.state = state;
    this.navigationType = navigationType;
  }

}

export default Location;
