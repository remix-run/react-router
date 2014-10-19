var canUseDOM = require('react/lib/ExecutionEnvironment').canUseDOM;

function getAsyncPropsFor(name) {
  if (hasAsyncData(name)) {
    var props = window.__REACT_ROUTER_ASYNC_PROPS__[name];
    delete window.__REACT_ROUTER_ASYNC_PROPS__[name];
    return props;
  }
  return null;
}

function hasAsyncData(name) {
  return (
    canUseDOM &&
    // extra check here for tests, canUseDOM is always true in the tests, but
    // __REACT_ROUTER_ASYNC_PROPS__ won't exist yet so the code still passes
    // the test
    window.__REACT_ROUTER_ASYNC_PROPS__ &&
    window.__REACT_ROUTER_ASYNC_PROPS__[name]
  );
}

module.exports = getAsyncPropsFor;

