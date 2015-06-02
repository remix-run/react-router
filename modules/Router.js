import React, { isValidElement } from 'react';
import warning from 'warning';
import invariant from 'invariant';
import Location from './Location';
import { createRoutes } from './RouteUtils';
import { routes, component, components, history, location } from './PropTypes';
import { getAndAssignComponentsProps } from './getComponentsProps';
import { getAndAssignComponents } from './getComponents';
import { getTransitionHooks } from './getTransitionHooks';
import { getProps } from './getProps';
import { branchMatches, getQueryString } from './PathUtils';
import qs from 'qs';

var { any, array, func, object, instanceOf } = React.PropTypes;
var parseQueryString = qs.parse;

function stringifyQuery(query) {
  return qs.stringify(query, { arrayFormat: 'brackets' });
}

function queryContains(query, props) {
  if (props == null)
    return true;

  if (query == null)
    return false;

  for (var p in props)
    if (props.hasOwnProperty(p) && String(query[p]) !== String(props[p]))
      return false;

  return true;
}

function createElement(component, props, extraProps) {
  if (typeof component === 'function')
    return React.createElement(component, Object.assign({}, props, extraProps));

  return null;
}

export class Router extends React.Component {

  static propTypes = {
    history,
    children: routes.isRequired,
    parseQueryString: func.isRequired,
    stringifyQuery: func.isRequired,
    onError: func.isRequired,
    onUpdate: func,

    // Primarily for server-side rendering.
    location: any,
    branch: routes,
    params: object,
    query: object,
    components,
    componentsProps: array
  };

  static defaultProps = {
    parseQueryString,
    stringifyQuery,
    location: '/',
    onError: function (error) {
      // Throw errors by default so we don't silently swallow them!
      throw error; // This error probably originated in getChildRoutes or getComponents.
    }
  };

  static childContextTypes = {
    router: instanceOf(Router).isRequired
  };

  constructor(props, context) {
    super(props, context);
    this.handleHistoryChange = this.handleHistoryChange.bind(this);
    this.transitionHooks = [];
    this.nextLocation = null;
    this.routes = null;
    this.state = {
      location: null,
      branch: null,
      params: null,
      query: null,
      components: null,
      componentsProps: null
    };
  }

  _updateLocation(location) {
    if (!Location.isLocation(location))
      location = Location.create(location);

    this.nextLocation = location;

    getProps(this.routes, location, this.props.parseQueryString, (error, props) => {
      if (error) {
        this.handleError(error);
        return;
      }

      warning(props, 'Location "%s" did not match any routes', location.path);

      if (props == null || !this._runTransitionHooks(props))
        return;

      this._getAndAssignComponents(props, (error) => {
        if (error) {
          this.handleError(error);
        } else if (this.nextLocation === location) {
          this._getAndAssignComponentsProps(props, (error) => {
            if (error) {
              this.handleError(error);
            } else if (this.nextLocation === location) {
              this.nextLocation = null;
              this.setState(props);
            }
          });
        }
      });
    });
  }

  _getAndAssignComponents(props, callback) {
    if (this.props.components) {
      props.components = this.props.components;
      callback();
    } else {
      getAndAssignComponents(props, callback);
    }
  }

  _getAndAssignComponentsProps(props, callback) {
    if (this.props.componentsProps) {
      props.componentsProps = this.props.componentsProps;
      callback();
    } else {
      getAndAssignComponentsProps(props, callback);
    }
  }

  _runTransitionHooks(nextProps) {
    var hooks = this.__getTransitionHooks(nextProps);
    var nextLocation = this.nextLocation;

    try {
      for (var i = 0, len = hooks.length; i < len; ++i) {
        hooks[i].call(this);

        if (this.nextLocation !== nextLocation)
          break; // No need to proceed further.
      }
    } catch (error) {
      this.handleError(error);
      return false;
    }

    // Allow the transition if nextLocation hasn't changed.
    return this.nextLocation === nextLocation;
  }

  // The extra preceeding _ here is due to a bug in babel
  // https://github.com/babel/babel/issues/1664
  __getTransitionHooks(nextState) {
    // Run component hooks before route hooks.
    var hooks = this.transitionHooks.map(hook => hook.bind(this, nextState, this));

    hooks.push.apply(
      hooks,
      getTransitionHooks(this.state, nextState, this)
    );

    return hooks;
  }

  /**
   * Adds a transition hook that runs before all route hooks in a
   * transition. The signature is the same as route transition hooks.
   */
  addTransitionHook(hook) {
    this.transitionHooks.push(hook);
  }

  /**
   * Removes the given transition hook.
   */
  removeTransitionHook(hook) {
    this.transitionHooks = this.transitionHooks.filter(h => h !== hook);
  }

  /**
   * Returns a full URL path from the given pathname and query.
   */
  makePath(pathname, query) {
    if (query) {
      if (typeof query !== 'string')
        query = this.props.stringifyQuery(query);

      if (query !== '')
        return pathname + '?' + query;
    }

    return pathname;
  }

  /**
   * Returns a string that may safely be used to link to the given
   * pathname and query.
   */
  makeHref(pathname, query) {
    var path = this.makePath(pathname, query);
    var { history } = this.props;

    if (history && history.makeHref)
      return history.makeHref(path);

    return path;
  }

  transitionTo(pathname, query) {
    var path = this.makePath(pathname, query);
    var { history } = this.props;

    if (history) {
      if (this.nextLocation) {
        history.replace(path);
      } else {
        history.push(path);
      }
    } else {
      this._updateLocation(path);
    }
  }

  replaceWith(pathname, query) {
    var path = this.makePath(pathname, query);
    var { history } = this.props;

    if (history) {
      history.replace(path);
    } else {
      this._updateLocation(path);
    }
  }

  go(n) {
    var { history } = this.props;
    invariant(history, 'Router#go needs a history');
    history.go(n);
  }

  goBack() {
    this.go(-1);
  }

  goForward() {
    this.go(1);
  }

  isActive(pathname, query) {
    return branchMatches(this.state.branch, pathname) && queryContains(this.state.query, query);
  }

  componentWillMount() {
    var { children, history, location } = this.props;

    this.routes = createRoutes(children);

    if (history) {
      if (typeof history.setup === 'function')
        history.setup();

      this._updateLocation(history.location);
    } else {
      this._updateLocation(location);
    }
  }

  handleHistoryChange() {
    this._updateLocation(this.props.history.location);
  }

  componentDidMount() {
    var { history } = this.props;

    if (history)
      history.addChangeListener(this.handleHistoryChange);
  }

  componentWillReceiveProps(nextProps) {
    invariant(
      this.props.history === nextProps.history,
      '<Router history> may not be changed'
    );

    if (this.props.children !== nextProps.children) {
      this.routes = createRoutes(nextProps.children);

      // Call this now because _updateLocation uses
      // this.routes to determine state.
      this._updateLocation(nextProps.location);
    } else if (this.props.location !== nextProps.location) {
      this._updateLocation(nextProps.location);
    }
  }

  componentDidUpdate() {
    if (this.props.onUpdate)
      this.props.onUpdate.call(this);
  }

  componentWillUnmount() {
    var { history } = this.props;

    if (history)
      history.removeChangeListener(this.handleHistoryChange);
  }

  getChildContext() {
    return {
      router: this
    };
  }

  render() {
    var { location, branch, params, query, components, componentsProps } = this.state;
    var element = null;

    if (components) {
      element = components.reduceRight(function (element, components, index) {
        var route = branch[index];

        if (components == null)
          return element; // Don't create new children; use the grandchildren.

        var props = { location, params, query, route };

        if (isValidElement(element)) {
          Object.assign(props, { children: element });
        } else if (element) {
          // In render, use children like:
          // var { header, sidebar } = this.props;
          Object.assign(props, element);
        }

        if (typeof components === 'object') {
          var elements = {};

          for (var key in components)
            if (components.hasOwnProperty(key))
              elements[key] = createElement(components[key], props, componentsProps[index] && componentProps[index][key]);

          return elements;
        }

        return createElement(components, props, componentsProps[index]);
      }, element);
    }

    invariant(
      element == null || isValidElement(element),
      'The root route must render a single element'
    );

    return element;
  }

}

export default Router;
