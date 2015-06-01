import invariant from 'invariant';

var RequiredSubclassMethods = [ 'push', 'replace', 'go' ];

/**
 * A history interface that normalizes the differences across
 * various environments and implementations. Requires concrete
 * subclasses to implement the following methods:
 *
 * - push(path)
 * - replace(path)
 * - go(n)
 */
export class History {

  constructor() {
    RequiredSubclassMethods.forEach(function (method) {
      invariant(
        typeof this[method] === 'function',
        '%s needs a "%s" method',
        this.constructor.name, method
      );
    }, this);

    this.changeListeners = [];
    this.location = null;
  }

  _notifyChange() {
    for (var i = 0, len = this.changeListeners.length; i < len; ++i)
      this.changeListeners[i].call(this);
  }

  addChangeListener(listener) {
    this.changeListeners.push(listener);
  }

  removeChangeListener(listener) {
    this.changeListeners = this.changeListeners.filter(function (li) {
      return li !== listener;
    });
  }

  back() {
    this.go(-1);
  }

  forward() {
    this.go(1);
  }

  makeHref(path) {
    return path;
  }

}

export default History;
