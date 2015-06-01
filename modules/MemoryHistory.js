import invariant from 'invariant';
import NavigationTypes from './NavigationTypes';
import Location from './Location';
import History from './History';

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
    }

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
    this.location = new Location(entries[current]);
  }

  // http://www.w3.org/TR/2011/WD-html5-20110113/history.html#dom-history-pushstate
  push(path) {
    this.current += 1;
    this.entries = this.entries.slice(0, this.current).concat([ path ]);
    this.location = new Location(path, null, NavigationTypes.PUSH);
    this._notifyChange();
  }

  // http://www.w3.org/TR/2011/WD-html5-20110113/history.html#dom-history-replacestate
  replace(path) {
    this.entries[this.current] = path;
    this.location = new Location(path, null, NavigationTypes.REPLACE);
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
    this.location = new Location(this.entries[this.current], null, NavigationTypes.POP);
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
