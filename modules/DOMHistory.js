import History from './History';

/**
 * A history interface that assumes a DOM environment.
 */
class DOMHistory extends History {

  static propTypes = Object.assign({}, History.propTypes);
  static defaultProps = Object.assign({}, History.defaultProps);
  static childContextTypes = Object.assign({}, History.childContextTypes);

  go(n) {
    if (n === 0)
      return;

    window.history.go(n);
  }

}

export default DOMHistory;
