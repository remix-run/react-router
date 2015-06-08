import invariant from 'invariant';
import ChangeEmitter from './ChangeEmitter';

var RequiredSubclassMethods = [ 'pushState', 'replaceState', 'go' ];

function createRandomKey() {
  return Math.random().toString(36).substr(2);
}

/**
 * A history interface that normalizes the differences across
 * various environments and implementations. Requires concrete
 * subclasses to implement the following methods:
 *
 * - pushState(state, path)
 * - replaceState(state, path)
 * - go(n)
 */
class History extends ChangeEmitter {

  constructor() {
    super();

    RequiredSubclassMethods.forEach(function (method) {
      invariant(
        typeof this[method] === 'function',
        '%s needs a "%s" method',
        this.constructor.name, method
      );
    }, this);

    this.location = null;
  }

  back() {
    this.go(-1);
  }

  forward() {
    this.go(1);
  }

  _createState(state) {
    state = state || {};

    if (!state.key)
      state.key = createRandomKey();

    return state;
  }

}

export default History;
