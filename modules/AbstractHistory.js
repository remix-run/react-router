var invariant = require('invariant');
var Location = require('./Location');

var _listenSingleton = null;

/**
 * A history interface that normalizes the differences across
 * various environments and implementations. Requires concrete
 * subclasses to implement the following methods:
 *
 * - getPath()
 * - push(path)
 * - replace(path)
 * - go(n)
 */
class AbstractHistory {

  static getSingleton() {
    return _listenSingleton;
  }

  constructor(length, current, navigationType) {
    invariant(
      typeof length === 'number' && length > 0,
      'History needs a length greater than 0'
    );

    if (current == null)
      current = length - 1;

    invariant(
      current < length,
      'History current value is out of bounds'
    );

    this.length = length;
    this.current = current;
    this.navigationType = navigationType;
  }

  /**
   * This is the high-level sugar API for adding a listener and
   * triggering it immediately in one shot, useful when you're
   * doing data-fetching before you render.
   *
   *   History.listen(function (location) {
   *     Router.match(location, function (error, props) {
   *       fetchData(props.branch, function (data) {
   *         wrapComponentsWithData(props.components, data);
   *         React.render(<Router {...props}/>, document.body);
   *       });
   *     });
   *   });
   */
  listen(listener) {
    _listenSingleton = this;
    this.addChangeListener(listener);
    listener.call(this, this.getLocation());
  }

  _notifyChange() {
    if (!this.changeListeners)
      return;

    var location = this.getLocation();

    for (var i = 0, len = this.changeListeners.length; i < len; ++i)
      this.changeListeners[i].call(this, location);
  }

  addChangeListener(listener) {
    if (!this.changeListeners)
      this.changeListeners = [];

    this.changeListeners.push(listener);
  }

  removeChangeListener(listener) {
    if (!this.changeListeners)
      return;

    this.changeListeners = this.changeListeners.filter(function (li) {
      return li !== listener;
    });
  }

  getLocation() {
    return new Location(this.getPath(), this.navigationType);
  }

  back() {
    this.go(-1);
  }

  forward() {
    this.go(1);
  }

  canGo(n) {
    if (n === 0)
      return true;

    var next = this.current + n;
    return next >= 0 && next < this.length;
  }

  canGoBack() {
    return this.canGo(-1);
  }

  canGoForward() {
    return this.canGo(1);
  }

  makeHref(path) {
    return path;
  }

  toJSON() {
    return {
      length: this.length,
      current: this.current,
      navigationType: this.navigationType
    };
  }

}

module.exports = AbstractHistory;
