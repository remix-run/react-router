function noop() {}

/**
 * History enhancer that overrides `listen` to only return a single location if
 * `location` is set in options.
 * @param  {CreateHistory} createHistory - history-creating function
 * @return {CreateHistory} New history-creating function
 */
export default function addSingleLocationSupport(createHistory) {
  return options => {
    const { location} = options;

    if (!location) {
      return createHistory(options);
    }

    const history = createHistory(location);

    function listen(listener) {
      listener(location);
      return noop;
    }

    return {
      ...history,
      listen
    };
  };
}
