import warning from './routerWarning'
import invariant from 'invariant'
import Redirect from './Redirect'

/**
 * An <IndexRedirect> is used to redirect from an indexRoute.
 */
/* eslint-disable react/require-render-return */
function IndexRedirect() {
    /* istanbul ignore next: sanity check */
    invariant(
        false,
        '<IndexRedirect> elements are for router configuration only and should not be rendered'
    )
}

IndexRedirect.createRouteFromReactElement = (element, parentRoute) => {
    /* istanbul ignore else: sanity check */
    if (parentRoute) {
        parentRoute.indexRoute = Redirect.createRouteFromReactElement(element)
    } else {
        warning(
            false,
            'An <IndexRedirect> does not make sense at the root of your route config'
        )
    }
}

export default IndexRedirect
