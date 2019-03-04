import createReactClass from 'create-react-class';
import { func } from 'prop-types';
import warning from './routerWarning';
import invariant from 'invariant';
import { createRouteFromReactElement as _createRouteFromReactElement } from './RouteUtils';
import { component, components, falsy } from './InternalPropTypes';

/**
 * An <IndexRoute> is used to specify its parent's <Route indexRoute> in
 * a JSX route config.
 */
/* eslint-disable react/require-render-return */
var IndexRoute = createReactClass({
  displayName: 'IndexRoute',

  statics: {
    createRouteFromReactElement: function createRouteFromReactElement(element, parentRoute) {
      /* istanbul ignore else: sanity check */
      if (parentRoute) {
        parentRoute.indexRoute = _createRouteFromReactElement(element);
      } else {
        process.env.NODE_ENV !== 'production' ? warning(false, 'An <IndexRoute> does not make sense at the root of your route config') : void 0;
      }
    }
  },

  propTypes: {
    path: falsy,
    component: component,
    components: components,
    getComponent: func,
    getComponents: func
  },

  /* istanbul ignore next: sanity check */
  render: function render() {
    !false ? process.env.NODE_ENV !== 'production' ? invariant(false, '<IndexRoute> elements are for router configuration only and should not be rendered') : invariant(false) : void 0;
  }
});

export default IndexRoute;