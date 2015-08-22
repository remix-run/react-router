/**
 * History enhancer that disables listening. Used inside `Router.run()`
 * @deprecated
 * @param {CreateHistory} createHistory - History-creating function
 */

function noop() {}

export default function disableListen(createHistory) {
  return options => {
    const history = createHistory(options);
    return {
      ...history,
      listen: noop
    }
  };
}
