var ReactDescriptor = require('react/lib/ReactDescriptor');
var ReactInstanceHandles = require('react/lib/ReactInstanceHandles');
var ReactMarkupChecksum = require('react/lib/ReactMarkupChecksum');
var ReactServerRenderingTransaction = require('react/lib/ReactServerRenderingTransaction');

var cloneWithProps = require('react/lib/cloneWithProps');
var copyProperties = require('react/lib/copyProperties');
var instantiateReactComponent = require('react/lib/instantiateReactComponent');
var invariant = require('react/lib/invariant');
var resolveAsyncValues = require('./resolveAsyncValues');

function cloneRoutesForServerRendering(routes) {
  return cloneWithProps(routes, {
    location: 'none',
    scrollBehavior: 'none'
  });
}

function mergeStateIntoInitialProps(state, props) {
  copyProperties(props, {
    initialPath: state.path,
    initialMatches: state.matches,
    initialActiveRoutes: state.activeRoutes,
    initialActiveParams: state.activeParams,
    initialActiveQuery: state.activeQuery
  });
}

/**
 * Renders a <Routes> component to a string of HTML at the given URL
 * path and calls callback(error, abortReason, html) when finished.
 *
 * If there was an error during the transition, it is passed to the
 * callback. Otherwise, if the transition was aborted for some reason,
 * it is given in the abortReason argument (with the exception of
 * internal redirects which are transparently handled for you).
 *
 * TODO: <NotFoundRoute> should be handled specially so servers know
 * to use a 404 status code.
 */
function renderRoutesToString(routes, path, callback) {
  invariant(
    ReactDescriptor.isValidDescriptor(routes),
    'You must pass a valid ReactComponent to renderRoutesToString'
  );

  var component = instantiateReactComponent(
    cloneRoutesForServerRendering(routes)
  );

  component.dispatch(path, function (error, abortReason, nextState) {
    if (error || abortReason)
      return callback(error, abortReason);

    mergeStateIntoInitialProps(nextState, component.props);

    updateProps(component, nextState.matches, nextState.query, function(err, data) {
      var transaction;
      try {
        var id = ReactInstanceHandles.createReactRootID();
        transaction = ReactServerRenderingTransaction.getPooled(false);

        transaction.perform(function () {
          var markup = component.mountComponent(id, transaction, 0);
          callback(null, null, ReactMarkupChecksum.addChecksumToMarkup(markup), data);
        }, null);
      } finally {
        ReactServerRenderingTransaction.release(transaction);
      }
    });

  });
}

function updateProps(component, matches, query, callback) {
  var pending = matches.length;
  var data = {};

  if (!pending)
    return callback.call(component, data);

  var completed = 0;
  var callbackWasCalled = false;

  function tryToFinish(error) {
    completed += 1;

    if (!callbackWasCalled && (error || pending === completed)) {
      callbackWasCalled = true;
      callback.call(component, error, data);
    }
  }

  matches.forEach(function (match) {
    var getRouteProps = match.route.props.handler.getRouteProps;

    if (match.props || getRouteProps == null) {
      tryToFinish();
    } else {
      match.props = {};

      function setProps(props) {
        if (match.isStale)
          return; // Do nothing.

        copyProperties(match.props, props);
        data[match.route.props.name] = match.props;
      }

      resolveAsyncValues(getRouteProps(match.params, query), setProps, tryToFinish);
    }
  });
}



/**
 * Renders a <Routes> component to static markup at the given URL
 * path and calls callback(error, abortReason, markup) when finished.
 */
function renderRoutesToStaticMarkup(routes, path, callback) {
  invariant(
    ReactDescriptor.isValidDescriptor(routes),
    'You must pass a valid ReactComponent to renderRoutesToStaticMarkup'
  );

  var component = instantiateReactComponent(
    cloneRoutesForServerRendering(routes)
  );

  component.dispatch(path, function (error, abortReason, nextState) {
    if (error || abortReason)
      return callback(error, abortReason);

    mergeStateIntoInitialProps(nextState, component.props);

    var transaction;
    try {
      var id = ReactInstanceHandles.createReactRootID();
      transaction = ReactServerRenderingTransaction.getPooled(false);

      transaction.perform(function () {
        callback(null, null, component.mountComponent(id, transaction, 0));
      }, null);
    } finally {
      ReactServerRenderingTransaction.release(transaction);
    }
  });
}

module.exports = {
  renderRoutesToString: renderRoutesToString,
  renderRoutesToStaticMarkup: renderRoutesToStaticMarkup
};
