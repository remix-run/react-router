var PathUtils = require('./PathUtils');

var STATE_KEY_QUERY_PARAM = '_sk';

function getHashPath() {
  return decodeURI(
    // We can't use window.location.hash here because it's not
    // consistent across browsers - Firefox will pre-decode it!
    window.location.href.split('#')[1] || ''
  );
}

function getWindowPath() {
  return decodeURI(
    window.location.pathname + window.location.search
  );
}

function getState(path) {
  var stateID = getStateID(path);
  var serializedState = stateID && window.sessionStorage.getItem(stateID);
  return serializedState ? JSON.parse(serializedState) : null;
}

function getStateID(path) {
  var query = PathUtils.extractQuery(path);
  return query && query[STATE_KEY_QUERY_PARAM];
}

function withStateID(path, stateID) {
  var query = Path.extractQuery(path) || {};
  query[STATE_KEY_QUERY_PARAM] = stateID;
  return PathUtils.withQuery(PathUtils.withoutQuery(path), query);
}

function withoutStateID(path) {
  var query = PathUtils.extractQuery(path);

  if (STATE_KEY_QUERY_PARAM in query) {
    delete query[STATE_KEY_QUERY_PARAM];
    return PathUtils.withQuery(PathUtils.withoutQuery(path), query);
  }

  return path;
}

function saveState(state) {
  var stateID = state.id;

  if (stateID == null)
    stateID = state.id = Math.random().toString(36).slice(2);

  window.sessionStorage.setItem(
    stateID,
    JSON.stringify(state)
  );

  return stateID;
}

function withState(path, state) {
  var stateID = state != null && saveState(state);
  return stateID ? withStateID(path, stateID) : withoutStateID(path);
}

module.exports = {
  getHashPath,
  getWindowPath,
  getState,
  getStateID,
  withStateID,
  withoutStateID,
  saveState,
  withState
};
