import React from 'react';
import createHashHistory from 'history/lib/createHashHistory';
import { createRoutes } from './RouteUtils';
import RoutingContext from './RoutingContext';
import useRoutes from './useRoutes';
import { routes } from './PropTypes';

var { func } = React.PropTypes;

/**
 * A <Router> is a high-level API for automatically setting up
 * a router that renders a <RoutingContext> with all the props
 * it needs each time the URL changes.
 */
var Router = React.createClass({
  
  propTypes: {
    children: routes,
    routes, // alias for children
    createHistory: func.isRequired,
    createElement: func,
    onError: func,
    onUpdate: func,
    parseQueryString: func,
    stringifyQuery: func
  },

  getDefaultProps() {
    return {
      createHistory: createHashHistory
    };
  },

  getInitialState() {
    return {
      location: null,
      routes: null,
      params: null,
      components: null
    };
  },

  handleError(error) {
    if (this.props.onError) {
      this.props.onError.call(this, error);
    } else {
      // Throw errors by default so we don't silently swallow them!
      throw error; // This error probably occurred in getChildRoutes or getComponents.
    }
  },

  componentWillMount() {
    var { children, routes, parseQueryString, stringifyQuery } = this.props;

    this.router = useRoutes(this.props.createHistory)({
      routes: createRoutes(routes || children),
      parseQueryString,
      stringifyQuery
    });

    this._unlisten = this.router.listen((error, state) => {
      if (error) {
        this.handleError(error);
      } else {
        this.setState(state, this.props.onUpdate);
      }
    });
  },

  componentWillUnmount() {
    if (this._unlisten)
      this._unlisten();
  },

  render() {
    return React.createElement(RoutingContext, {
      ...this.state,
      router: this.router,
      createElement: this.props.createElement
    });
  }

});

export default Router;
