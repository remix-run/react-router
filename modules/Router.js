import warning from 'warning';
import invariant from 'invariant';
import { createClass, createElement, isValidElement, PropTypes } from 'react';
import { component, components, history, location, routes } from './PropTypes';
import { createRoutes } from './RouteUtils';
import matchRoutes from './matchRoutes';
import runTransitionHooks from './runTransitionHooks';
import getComponents from './getComponents';
import getRouteParams from './getRouteParams';

import NavigationMixin from './NavigationMixin';
import ScrollManagementMixin from './ScrollManagementMixin';
import ActiveMixin from './ActiveMixin';

var { arrayOf, func, object } = PropTypes;

import qs from 'qs';

function stringifyQuery(query) {
  return qs.stringify(query, { arrayFormat: 'brackets' });
}

function parseQueryString(queryString) {
  return qs.parse(queryString);
}

var Router = createClass({

  mixins: [ NavigationMixin, ScrollManagementMixin, ActiveMixin ],

  statics: {

    run(routes, location, callback, prevState=null) {
      matchRoutes(routes, location, function (error, nextState) {
        if (error || nextState == null) {
          callback(error, null);
        } else {
          nextState.location = location;
          runTransitionHooks(prevState, nextState, function (error, redirectInfo) {
            if (error || redirectInfo) {
              callback(error, null, redirectInfo);
            } else {
              getComponents(nextState, function (error, components) {
                if (error) {
                  callback(error);
                } else {
                  nextState.components = components;
                  callback(null, nextState);
                }
              });
            }
          });
        }
      });
    }

  },

  childContextTypes: {
    router: object
  },

  getChildContext() {
    return {
      router: this
    };
  },

  propTypes: {
    createElement: func,
    parseQueryString: func,
    stringifyQuery: func,
    onError: func,
    onUpdate: func,
    routes,
    // Routes may also be given as children (JSX)
    children: routes,

    // Client-side
    history,

    // Server-side
    location
  },

  getDefaultProps() {
    return {
      createElement,
      parseQueryString,
      stringifyQuery
    };
  },

  getInitialState() {
    return {
      isTransitioning: false,
      location: null,
      routes: null,
      params: null,
      components: null
    };
  },

  updateLocation(location) {
    if (!location.query)
      location.query = this.props.parseQueryString(location.search.substring(1));

    this.setState({
      isTransitioning: true
    });

    Router.run(this.routes, location, (error, state, redirectInfo) => {
      if (error) {
        this.handleError(error);
      } else if (redirectInfo) {
        var { pathname, query, state } = redirectInfo;
        this.replaceWith(pathname, query, state);
      } else if (state == null) {
        warning(
          false,
          'Location "%s" did not match any routes',
          location.pathname + location.search
        );
      } else {
        this.setState(state, this.props.onUpdate);
      }

      this.setState({
        isTransitioning: false
      });
    }, this.state);
  },

  updateHistory(history) {
    if (this._unlisten) {
      this._unlisten();
      this._unlisten = null;
    }

    if (history)
      this._unlisten = history.listen(this.updateLocation);
  },

  handleError(error) {
    if (this.props.onError) {
      this.props.onError.call(this, error);
    } else {
      // Throw errors by default so we don't silently swallow them!
      throw error; // This error probably originated in getChildRoutes or getComponents.
    }
  },

  componentWillMount() {
    var { routes, children, history, location } = this.props;

    invariant(
      routes || children,
      '<Router>s need routes. Try using <Router routes> or ' +
      'passing your routes as nested <Route> children'
    );

    this.routes = createRoutes(routes || children);

    if (history) {
      this.updateHistory(history);
    } else if (location) {
      this.updateLocation(location);
    }
  },

  componentWillReceiveProps(nextProps) {
    // TODO
  },

  componentWillUnmount() {
    if (this._unlisten)
      this._unlisten();
  },

  createPath(pathname, query) {
    var { stringifyQuery } = this.props;

    var queryString;
    if (query == null || (queryString = stringifyQuery(query)) === '')
      return pathname;

    return pathname + (pathname.indexOf('?') === -1 ? '?' : '&') + queryString;
  },

  createElement(component, props) {
    return typeof component === 'function' ? this.props.createElement(component, props) : null;
  },

  render() {
    var { routes, params, components } = this.state;
    var element = null;

    if (components) {
      element = components.reduceRight((element, components, index) => {
        if (components == null)
          return element; // Don't create new children; use the grandchildren.

        var route = routes[index];
        var routeParams = getRouteParams(route, params);
        var props = Object.assign({}, this.state, { route, routeParams });

        if (isValidElement(element)) {
          props.children = element;
        } else if (element) {
          // In render, do var { header, sidebar } = this.props;
          Object.assign(props, element);
        }

        if (typeof components === 'object') {
          var elements = {};

          for (var key in components)
            if (components.hasOwnProperty(key))
              elements[key] = this.createElement(components[key], props);

          return elements;
        }

        return this.createElement(components, props);
      }, element);
    }

    invariant(
      element === null || element === false || isValidElement(element),
      'The root route must render a single element'
    );

    return element;
  }

});

export default Router;
