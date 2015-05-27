import React from 'react';
import invariant from 'invariant';
import isReactChildren from './isReactChildren';
import createRoutesFromReactChildren from './createRoutesFromReactChildren';
import { getPathname, compilePattern, stripLeadingSlashes } from './PathUtils';
import { loopAsync, mapAsync } from './AsyncUtils';
import { location, routes } from './PropTypes';
import Location from './Location';
import passMiddlewareProps from './passMiddlewareProps';
var { func } = React.PropTypes;

function getChildRoutes(route, callback) {
  if (route.childRoutes) {
    callback(null, route.childRoutes);
  } else if (route.getChildRoutes) {
    route.getChildRoutes(callback);
  } else {
    callback();
  }
}

function assignParams(params, paramNames, paramValues) {
  return paramNames.reduceRight(function (params, paramName, index) {
    var paramValue = paramValues[index];

    if (Array.isArray(params[paramName])) {
      params[paramName].unshift(paramValue);
    } else if (paramName in params) {
      params[paramName] = [ paramValue, params[paramName] ];
    } else {
      params[paramName] = paramValue;
    }

    return params;
  }, params);
}

function createParams(paramNames, paramValues) {
  return assignParams({}, paramNames, paramValues);
}

function matchPattern(pattern, pathname) {
  var { escapedSource, paramNames, tokens } = compilePattern(stripLeadingSlashes(pattern));

  escapedSource += '/*'; // Ignore trailing slashes

  var captureRemaining = tokens[tokens.length - 1] !== '*';

  if (captureRemaining)
    escapedSource += '(.*?)';

  var match = pathname.match(new RegExp('^' + escapedSource + '$', 'i'));

  var remainingPathname, paramValues;
  if (match != null) {
    paramValues = Array.prototype.slice.call(match, 1);

    if (captureRemaining) {
      remainingPathname = paramValues.pop();
    } else {
      remainingPathname = pathname.replace(match[0], '');
    }
  }

  return {
    remainingPathname,
    paramNames,
    paramValues
  };
}

function matchRouteDeep(route, pathname, callback) {
  var { remainingPathname, paramNames, paramValues } = matchPattern(route.path, pathname);

  if (remainingPathname === '') {
    // This route matched the whole path!
    callback(null, {
      params: createParams(paramNames, paramValues),
      branch: [ route ]
    });
  } else if (remainingPathname != null) {
    // This route matched at least some of the path.
    getChildRoutes(route, function (error, childRoutes) {
      if (error) {
        callback(error);
      } else if (childRoutes) {
        if (isReactChildren(childRoutes))
          childRoutes = createRoutesFromReactChildren(childRoutes);

        // Check the child routes to see if any of them match.
        matchRoutes(childRoutes, remainingPathname, function (error, match) {
          if (error) {
            callback(error);
          } else if (match) {
            // A child route matched! Augment the match and pass it up the stack.
            assignParams(match.params, paramNames, paramValues);
            match.branch.unshift(route);
            callback(null, match);
          } else {
            callback();
          }
        });
      } else {
        callback();
      }
    });
  } else {
    callback();
  }
}

function matchRoutes(routes, pathname, callback) {
  loopAsync(routes.length, function (index, next, done) {
    matchRouteDeep(routes[index], pathname, function (error, match) {
      if (error || match) {
        done(error, match);
      } else {
        next();
      }
    });
  }, callback);
}

function findMatch(routes, path, callback) {
  if (!Array.isArray(routes))
    routes = [ routes ]; // Allow a single route

  var pathname = stripLeadingSlashes(getPathname(path));

  matchRoutes(routes, pathname, callback);
}

function getComponents(route, callback) {
  if (route.component || route.components) {
    callback(null, route.component || route.components);
  } else if (route.getComponents) {
    route.getComponents(callback);
  } else {
    callback();
  }
}

function getComponentsForBranch(branch, callback) {
  mapAsync(branch, function (route, index, callback) {
    getComponents(route, function (error, components) {
      if (error) {
        callback(error);
      } else {
        invariant(
          !Array.isArray(components),
          'Components must not be an array'
        );

        callback(null, components);
      }
    });
  }, callback);
}

function throwError(error) {
  throw error; // This error probably originated in getChildRoutes or getComponents.
}

/**
 * A middleware that provides asynchronous route configuration and
 * component loading.
 */
class AsyncRouting extends React.Component {

  /**
   * Asynchronously matches the given location to a set of routes and calls
   * callback(error, match) when finished. The match object may have the
   * following properties:
   *
   * - location     The Location object
   * - branch       An array of routes that matched, in hierarchical order
   * - params       An object of URL parameters
   * - components   An array of components for each route in branch
   *
   * Note: This operation may be completely synchronous if no routes have
   * an asynchronous getChildRoutes or getComponents method.
   */
  static match(routes, location, callback) {
    invariant(
      routes != null,
      'AsyncRouting.match needs some routes'
    );

    if (isReactChildren(routes)) {
      // Allow routes to be specified as JSX.
      routes = createRoutesFromReactChildren(routes);
    } else if (!Array.isArray(routes)) {
      routes = [ routes ];
    }

    if (!(location instanceof Location)) {
      if (typeof location === 'string') {
        location = new Location(location);
      } else if (location && location.path) {
        location = new Location(
          location.path,
          location.query,
          location.navigationType,
          location.key,
          location.scrollPosition
        );
      }
    }

    invariant(
      location instanceof Location,
      'AsyncRouting.match needs a Location'
    );

    findMatch(routes, location.path, function (error, match) {
      if (error || match == null) {
        callback(error, match);
      } else {
        getComponentsForBranch(match.branch, function (error, components) {
          if (error) {
            callback(error);
          } else {
            match.location = location;
            match.components = components;
            callback(null, match);
          }
        });
      }
    });
  }

  static propTypes = {
    location: location,
    routes: routes,
    onError: func
  };

  static defaultProps = {
    onError: throwError
  };

  constructor(props, context) {
    super(props, context);
    this.nextLocation = null;
    this.state = {
      location: null,
      branch: null,
      params: null,
      components: null
    };
  }

  _updateState(routes, location) {
    this.nextLocation = location;

    AsyncRouting.match(routes, location, (error, match) => {
      if (error) {
        this.props.onError(error);
        return;
      }

      if (this.nextLocation !== location)
        return; // Another transition interrupted this one.

      this.nextLocation = null;

      if (match)
        this.setState(match);
    });
  }

  componentWillMount() {
    this._updateState(this.props.routes, this.props.location);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.routes !== nextProps.routes || this.props.location !== nextProps.location)
      this._updateState(nextProps.routes, nextProps.location);
  }

  render() {
    var { location, branch, params, components } = this.state;

    if (!(location && branch && params && components))
      return null; // Do not render anything until we resolve.

    return passMiddlewareProps(this.props, {
      location,
      branch,
      params,
      components,
    });
  }

}

export default AsyncRouting;
