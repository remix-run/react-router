import invariant from 'invariant';

var NavigationMixin = {

  /**
   * Returns a string that may safely be used to link to the given
   * pathname and query.
   */
  createHref(pathname, query) {
    var path = this.createPath(pathname, query);
    var { history } = this.props;

    if (history && history.createHref)
      return history.createHref(path);

    return path;
  },
 
  /**
   * Pushes a new Location onto the history stack.
   */
  transitionTo(pathname, query, state=null) {
    var { history } = this.props;

    invariant(
      history,
      'Router#transitionTo needs history'
    );

    history.pushState(state, this.createPath(pathname, query));
  },

  /**
   * Replaces the current Location on the history stack.
   */
  replaceWith(pathname, query, state=null) {
    var { history } = this.props;

    invariant(
      history,
      'Router#replaceWith needs history'
    );

    history.replaceState(state, this.createPath(pathname, query));
  },

  /**
   * Navigates forward/backward n entries in the history stack.
   */
  go(n) {
    var { history } = this.props;

    invariant(
      history,
      'Router#go needs history'
    );

    history.go(n);
  },

  /**
   * Navigates back one entry in the history stack. This is identical to
   * the user clicking the browser's back button.
   */
  goBack() {
    this.go(-1);
  },

  /**
   * Navigates forward one entry in the history stack. This is identical to
   * the user clicking the browser's forward button.
   */
  goForward() {
    this.go(1);
  }
 
};

export default NavigationMixin;
