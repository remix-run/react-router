import React from 'react';

var { object } = React.PropTypes;

/**
 * The RouteContext mixin provides a convenient way for route
 * components to set the route in context. This is needed for
 * routes that render elements that want to use the Lifecycle
 * mixin to prevent transitions.
 */
var RouteContext = {

  propTypes: {
    route: object.isRequired
  },
  
  childContextTypes: {
    route: object.isRequired
  },

  getChildContext() {
    return {
      route: this.props.route
    };
  }

};

export default RouteContext;
