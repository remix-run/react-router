var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

import invariant from 'invariant';
import React from 'react';
import createReactClass from 'create-react-class';
import hoistStatics from 'hoist-non-react-statics';
import { routerShape } from './PropTypes';
import { RouterContextMain } from './RouterContext';

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

export default function withRouter(WrappedComponent, options) {
  var withRef = options && options.withRef;

  var WithRouter = createReactClass({
    displayName: 'WithRouter',

    statics: {
      contextType: RouterContextMain
    },

    propTypes: { router: routerShape },

    getWrappedInstance: function getWrappedInstance() {
      !withRef ? process.env.NODE_ENV !== 'production' ? invariant(false, 'To access the wrapped instance, you need to specify ' + '`{ withRef: true }` as the second argument of the withRouter() call.') : invariant(false) : void 0;

      return this.wrappedInstance;
    },
    render: function render() {
      var _this = this;

      var router = this.props.router || this.context.router;
      if (!router) {
        return React.createElement(WrappedComponent, this.props);
      }

      var params = router.params,
          location = router.location,
          routes = router.routes;

      var props = _extends({}, this.props, { router: router, params: params, location: location, routes: routes });

      if (withRef) {
        props.ref = function (c) {
          _this.wrappedInstance = c;
        };
      }

      return React.createElement(WrappedComponent, props);
    }
  });

  WithRouter.displayName = 'withRouter(' + getDisplayName(WrappedComponent) + ')';
  WithRouter.WrappedComponent = WrappedComponent;

  return hoistStatics(WithRouter, WrappedComponent);
}