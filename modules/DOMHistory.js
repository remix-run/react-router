import History from './History';

/**
 * A history interface that assumes a DOM environment.
 */
class DOMHistory extends History {

  go(n) {
    if (n === 0)
      return;

    window.history.go(n);
  }

}

export default DOMHistory;
