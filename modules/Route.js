import invariant from 'invariant'
import { createRouteFromReactElement } from './RouteUtils'

/**
 * A <Route> is used to declare which components are rendered to the
 * page when the URL matches a given pattern.
 *
 * Routes are arranged in a nested tree structure. When a new URL is
 * requested, the tree is searched depth-first to find a route whose
 * path matches the URL.  When one is found, all routes in the tree
 * that lead to it are considered "active" and their components are
 * rendered into the DOM, nested in the same order as in the tree.
 */
/* eslint-disable react/require-render-return */
function Route() {
    /* istanbul ignore next: sanity check */
    invariant(
        false,
        '<Route> elements are for router configuration only and should not be rendered'
    )
}

Route.createRouteFromReactElement = createRouteFromReactElement

export default Route
