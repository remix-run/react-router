import createReactClass from 'create-react-class';
import { string, object } from 'prop-types';
import warning from './routerWarning';
import invariant from 'invariant';
import Redirect from './Redirect';
import { falsy } from './InternalPropTypes';

/**
 * An <IndexRedirect> is used to redirect from an indexRoute.
 */
/* eslint-disable react/require-render-return */
var IndexRedirect = createReactClass({
  displayName: 'IndexRedirect',

  statics: {
    createRouteFromReactElement: function createRouteFromReactElement(element, parentRoute) {
      /* istanbul ignore else: sanity check */
      if (parentRoute) {
        parentRoute.indexRoute = Redirect.createRouteFromReactElement(element);
      } else {
        process.env.NODE_ENV !== 'production' ? warning(false, 'An <IndexRedirect> does not make sense at the root of your route config') : void 0;
      }
    }
  },

  propTypes: {
    to: string.isRequired,
    query: object,
    state: object,
    onEnter: falsy,
    children: falsy
  },

  /* istanbul ignore next: sanity check */
  render: function render() {
    !false ? process.env.NODE_ENV !== 'production' ? invariant(false, '<IndexRedirect> elements are for router configuration only and should not be rendered') : invariant(false) : void 0;
  }
});

export default IndexRedirect;