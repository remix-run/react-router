import React from 'react'
import invariant from 'invariant'
import warning from 'warning'
import Redirect from './Redirect'
import { falsy } from './PropTypes'

const { string, object } = React.PropTypes

/**
 * An <IndexRedirect> is used to redirect from an indexRoute.
 */
class IndexRedirect extends React.Component {

  static createRouteFromReactElement(element, parentRoute) {
    if (parentRoute) {
      parentRoute.indexRoute = Redirect.createRouteFromReactElement(element)
    } else {
      warning(
        false,
        'An <IndexRedirect> does not make sense at the root of your route config'
      )
    }
  }

  static propTypes = {
    to: string.isRequired,
    query: object,
    state: object,
    onEnter: falsy,
    children: falsy
  }

  render() {
    invariant(
      false,
      '<IndexRedirect> elements are for router configuration only and should not be rendered'
    )
  }

}

export default IndexRedirect
