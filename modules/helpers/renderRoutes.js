var React = require('react/addons');
var ActiveStore = require('../stores/ActiveStore');
var Path = require('../helpers/Path');
var makePath = require('../helpers/makePath');
var Transition = require('../helpers/Transition');
var copyProperties = require('react/lib/copyProperties');
var RouteStore = require('../stores/RouteStore');
var PathStore = require('../stores/PathStore');
var ServerLocation = require('../locations/ServerLocation');
var Promise = require('es6-promise').Promise;
var ExecutionEnvironment = require('react/lib/ExecutionEnvironment');

var renderRoutes = function (routes, fullPath, staticMarkup) {

  return new Promise(function (resolve, reject) {
    var query = Path.extractQuery(fullPath) || {};
    var initialData = {};
    var promises = [];
    var httpStatus = 200;

    RouteStore.unregisterAllRoutes();
    var registeredRoutes = RouteStore.registerChildren(routes.props.children, routes);
    var matches = routes.constructor.findMatches(Path.withoutQuery(fullPath), registeredRoutes, routes.props.defaultRoute);

    if (!matches) {
      var error = new Error("Not route matched path.");
      error.status = error.httpStatus = 404;
      throw error;
    }

    if (matches.length) {
      //Loop over all matches getInitalAsyncState and apply
      promises = matches.map(function (match, i){
        var handler = match.route.props.handler;

        //check matches for redirect and httpStatus
        if (handler.willTransitionTo) {
          var transition = new Transition(fullPath);
          handler.willTransitionTo(transition, match.params, query);
          if (transition.isAborted) {            
            //should throw and be caught by Promise
            routes.constructor.defaultAbortedTransitionHandler(transition);
          }
        }
        //getInitialAsyncState from AsyncState mixin
        if (handler.getInitialAsyncState) {
          return handler.getInitialAsyncState(match.params, query, function (state) {
            initialData[i] = state;
          });
        }
        return Promise.resolve(true);
      });
    }

    Promise.all(promises).then(function () {

      RouteStore.unregisterAllRoutes();

      var newRoutes = React.addons.cloneWithProps(routes, {
        location: ServerLocation,
        initialPath: fullPath, 
        initialData: initialData
      });

      var html;
      if (!staticMarkup) {
        var initialDataScript = '<script type="text/javascript">window.__ReactRouter_initialData=' + JSON.stringify(initialData) + ';<\/script>';
        html = React.renderComponentToString(newRoutes) + initialDataScript;
      } else {
        html = React.renderComponentToStaticMarkup(newRoutes)
      }

      RouteStore.unregisterAllRoutes();

      resolve({
        html: html,
        httpStatus: httpStatus,
        status: httpStatus
      });
    }).catch(reject);

  });
};

module.exports = renderRoutes;
