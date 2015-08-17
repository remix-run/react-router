import warning from 'warning';
import invariant from 'invariant';
import { createClass, createElement, isValidElement, PropTypes } from 'react';
import { component, components, history, location, routes, router } from './PropTypes';
import { createRoutes } from './RouteUtils';
import createRouter, { run } from './createRouter';
import getComponents from './getComponents';
import getRouteParams from './getRouteParams';

import NavigationMixin from './NavigationMixin';
import ScrollManagementMixin from './ScrollManagementMixin';
import ActiveMixin from './ActiveMixin';

const { arrayOf, func, object } = PropTypes;

const RouterComponent = createClass({

  mixins: [ NavigationMixin, ScrollManagementMixin, ActiveMixin ],

  statics: {
    run
  },

  childContextTypes: {
    router: object
  },

  getChildContext() {
    return {
      router: this.router
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
    location,

    // Or create router outside of router component
    router: object
  },

  getDefaultProps() {
    return {
      createElement
    };
  },

  getInitialState() {
    const { routes, children } = this.props;
    let { router } = this.props;

    if (!router) {
      invariant(
        routes || children,
        '<Router>s need routes. Try using <Router routes> or ' +
        'passing your routes as nested <Route> children'
      );

      const routerProps = {
        ...this.props,
        routes: createRoutes(routes || children),
        onError: this.handleError
      };

      router = createRouter(routerProps);
    }

    this.router = router;

    return {
      ...this.router.getState(),
      components: null
    };
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
    this._unlisten = this.router.listen(this.handleRouterUpdate);
    this.handleRouterUpdate();
  },

  componentWillReceiveProps(nextProps) {
    // TODO
  },

  componentWillUnmount() {
    if (this._unlisten)
      this._unlisten();
  },

  handleRouterUpdate() {
    const routerState = this.router.getState();

    getComponents(routerState, (error, components) => {
      if (error) {
        callback(error);
      } else {
        const nextState = {
          ...routerState,
          components
        };

        this.setState(nextState, this.props.onUpdate);
      }
    });
  },

  createElement(component, props) {
    return component ? this.props.createElement(component, props) : null;
  },

  render() {
    const { routes, params, components } = this.state;
    let element = null;

    if (components) {
      element = components.reduceRight((element, components, index) => {
        if (components == null)
          return element; // Don't create new children; use the grandchildren.

        const route = routes[index];
        const routeParams = getRouteParams(route, params);
        const props = { ...this.state, route, routeParams };

        if (isValidElement(element)) {
          props.children = element;
        } else if (element) {
          // In render, do var { header, sidebar } = this.props;
          Object.assign(props, element);
        }

        if (typeof components === 'object') {
          let elements = {};

          for (let key in components)
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

export default RouterComponent;
