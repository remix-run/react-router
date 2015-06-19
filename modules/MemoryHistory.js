import invariant from 'invariant';
import NavigationTypes from './NavigationTypes';
import History from './History';

/**
 * A concrete History class that doesn't require a DOM. Ideal
 * for testing because it allows you to specify route history
 * entries in the constructor.
 */
class MemoryHistory extends History {

  constructor(entries, current) {
    super();

    if (entries == null) {
      entries = [ '/' ];
    } else if (typeof entries === 'string') {
      entries = [ entries ];
    } else if (!Array.isArray(entries)) {
      throw new Error('MemoryHistory needs an array of entries');
    }

    entries = entries.map(this._createEntry.bind(this));

    if (current == null) {
      current = entries.length - 1;
    } else {
      invariant(
        current >= 0 && current < entries.length,
        '%s current index must be >= 0 and < %s, was %s',
        this.constructor.name, entries.length, current
      );
    }

    this.current = current;
    this.entries = entries;
    this.storage = entries
      .filter(entry => entry.state)
      .reduce((all, entry) => {
        all[entry.key] = entry.state;
        return all;
      }, {});
  }

  setup() {
    if (this.location)
      return;

    var entry = this.entries[this.current];
    var path = entry.path;
    var key = entry.key;

    super.setup(path, {key, current: this.current});
  }

  _createEntry(object) {
    var key = this.createRandomKey();
    if (typeof object === 'string')
      return { path: object, key };

    if (typeof object === 'object' && object)
      return {...object, key};

    throw new Error('Unable to create history entry from ' + object);
  }

  // http://www.w3.org/TR/2011/WD-html5-20110113/history.html#dom-history-pushstate
  push(path, key) {
    this.current += 1;
    this.entries = this.entries.slice(0, this.current).concat([{ key, path }]);

    return {key, current: this.current};
  }

  // http://www.w3.org/TR/2011/WD-html5-20110113/history.html#dom-history-replacestate
  replace(path, key) {
    this.entries[this.current] = { key, path };

    return {key, current: this.current};
  }

  readState(key) {
    return this.storage[key];
  }

  saveState(key, state){
    this.storage[key] = state;
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

    this.handlePop(currentEntry.path, {key: currentEntry.key, current: this.current});
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
