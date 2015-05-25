import React from 'react';
import invariant from 'invariant';
import NavigationTypes from './NavigationTypes';
import History from './History';
import assign from 'object-assign';

var { arrayOf, string, object, number, oneOfType } = React.PropTypes;

var locationShape = shape({
  path: string.isRequired,
  query: object,
  navigationType: string
});

function parseEntry(entry) {
  return typeof entry === 'string' ? { path: entry } : path;
}

/**
 * A concrete History class that doesn't require a DOM. Ideal
 * for testing because it allows you to specify route history
 * entries in the constructor.
 */
class MemoryHistory extends History {

  static propTypes = assign({}, History.propTypes, {
    entries: arrayOf(oneOfType(locationShape, string)).isRequired,
    current: number
  });

  static defaultProps = assign({}, History.defaultProps, {
    entries: [ '/' ]
  });

  static childContextTypes = assign({}, History.childContextTypes);
  
  constructor(props) {
    super(props);

    var { current, entries } = props;

    if (current == null) {
      current = entries.length - 1;
    } else {
      invariant(
        current >= 0 && current < entries.length,
        '%s current index must be >= 0 and < %s, was %s',
        this.constructor.name, entries.length, current
      );
    }

    assign(this.state, {
      entries,
      current
    });
  }

  componentWillMount() {
    super.componentWillMount();

    var { entries, current } = this.state;
    var { path, query, navigationType } = parseEntry(entries[current]);

    this.setState({
      location: new Location(path, query, navigationType)
    });
  }

  push(path, query) {
    // http://www.w3.org/TR/2011/WD-html5-20110113/history.html#dom-history-pushstate
    var { entries, current } = this.state;

    current += 1;
    entries = entries.slice(0, current).concat([{ path, query }]);

    this.setState({
      location: new Location(path, query, NavigationTypes.PUSH),
      current,
      entries
    });
  }

  replace(path, query) {
    // http://www.w3.org/TR/2011/WD-html5-20110113/history.html#dom-history-replacestate
    var { entries, current } = this.state;
    entries[current] = { path, query };

    this.setState({
      location: new Location(path, query, NavigationTypes.REPLACE),
      entries
    });
  }

  go(n) {
    if (n === 0)
      return;

    invariant(
      this.canGo(n),
      '%s cannot go(%s) because there is not enough history',
      this.constructor.name, n
    );

    var { entries, current } = this.state;
    current += n;

    var { path, query } = parseEntry(entries[current]);

    this.setState({
      location: new Location(path, query, NavigationTypes.POP),
      current
    });
  }

  canGo(n) {
    var index = this.state.current + n;
    return index >= 0 && index < this.state.entries.length;
  }

  canGoBack() {
    return this.canGo(-1);
  }

  canGoForward() {
    return this.canGo(1);
  }

}

export default MemoryHistory;
