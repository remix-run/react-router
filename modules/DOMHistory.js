import History from './History';
import assign from 'object-assign';

/**
 * A history interface that assumes a DOM environment.
 */
class DOMHistory extends History {

  static propTypes = assign({}, History.propTypes);
  static defaultProps = assign({}, History.defaultProps);
  static childContextTypes = assign({}, History.childContextTypes);

  go(n) {
    if (n === 0)
      return;

    window.history.go(n);
  }

}

export default DOMHistory;
