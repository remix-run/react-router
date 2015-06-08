import invariant from 'invariant';
import NavigationTypes from './NavigationTypes';
import Location from './Location';
import History from './History';

function createEntry(object) {
  if (typeof object === 'string')
    return { path: object };

  if (object && typeof object === 'object') {
    invariant(
      typeof object.path === 'string',
      'A history entry must have a string path'
    );

    return object;
  }

  throw new Error('Unable to create history entry from ' + object);
}

/**
 * A concrete History class that doesn't require a DOM. Ideal
 * for testing because it allows you to specify route history
 * entries in the constructor.
 */
export class MemoryHistory extends History {

  constructor(entries, current) {
    super();

    if (entries == null) {
      entries = [ '/' ];
    } else if (typeof entries === 'string') {
      entries = [ entries ];
    } else if (!Array.isArray(entries)) {
      throw new Error('MemoryHistory needs an array of entries');
    }

    entries = entries.map(createEntry);

    if (current == null) {
      current = entries.length - 1;
    } else {
      invariant(
        current >= 0 && current < entries.length,
        '%s current index must be >= 0 and < %s, was %s',
        this.constructor.name, entries.length, current
      );
    }

    this.entries = entries;
    this.current = current;

    var currentEntry = entries[current];

    this.location = new Location(
      currentEntry.state || null,
      currentEntry.path
    );
  }

  // http://www.w3.org/TR/2011/WD-html5-20110113/history.html#dom-history-pushstate
  pushState(state, path) {
    state = this._createState(state);

    this.current += 1;
    this.entries = this.entries.slice(0, this.current).concat([{ state, path }]);
    this.location = new Location(state, path, NavigationTypes.PUSH);

    this._notifyChange();
  }

  // http://www.w3.org/TR/2011/WD-html5-20110113/history.html#dom-history-replacestate
  replaceState(state, path) {
    state = this._createState(state);

    this.entries[this.current] = { state, path };
    this.location = new Location(state, path, NavigationTypes.REPLACE);

    this._notifyChange();
  }

  go(n) {
    if (n === 0)
      return;

    invariant(
      this.canGo(n),
      '%s cannot go(%s) because there is not enough history',
      this.constructor.name, n
    );

    this.current += n;
    var currentEntry = this.entries[this.current];

    this.location = new Location(
      currentEntry.state || null,
      currentEntry.path,
      NavigationTypes.POP
    );

    this._notifyChange();
  }

  canGo(n) {
    var index = this.current + n;
    return index >= 0 && index < this.entries.length;
  }

  canGoBack() {
    return this.canGo(-1);
  }

  canGoForward() {
    return this.canGo(1);
  }

}

export default MemoryHistory;
