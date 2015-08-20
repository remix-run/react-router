/**
 * History enhancer that adds additional navigation methods — `transitionTo()`
 * and `replaceWith()`. TODO: move to history module (?)
 * @param {CreateHistory} createHistory - History-creating function
 * @returns {CreateHistory}
 */
export default function addNavigation(createHistory) {
  return (...args) => {
    const history = createHistory(...args);

    /**
     * Pushes a new Location onto the history stack.
     * @param {string} pathname
     * @param {Object} query
     * @param {Object} State
     */
    function transitionTo(pathname, query, state = null) {
      history.pushState(state, history.createHref(pathname, query));
    }

    /**
     * Replaces the current Location on the history stack.
     * @param {string} pathname
     * @param {Object} query
     * @param {Object} State
     */
    function replaceWith(pathname, query, state = null) {
      history.replaceState(state, history.createHref(pathname, query));
    }

    return {
      ...history,
      transitionTo,
      replaceWith
    };
  };
}
