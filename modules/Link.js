/*
 * Copyright (c) 2019 American Express Travel Related Services Company, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */

import React from 'react'
import { bool, object, string, func, oneOfType } from 'prop-types'
import invariant from 'invariant'
import { Context as RouterContext } from './RouterContext'

function isLeftClickEvent(event) {
  return event.button === 0
}

function isModifiedEvent(event) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
}

// TODO: De-duplicate against hasAnyProperties in createTransitionManager.
function isEmptyObject(object) {
  for (const p in object)
    if (Object.prototype.hasOwnProperty.call(object, p))
      return false

  return true
}

function resolveToLocation(to, router) {
  return typeof to === 'function' ? to(router.location) : to
}

/**
 * A <Link> is used to create an <a> element that links to a route.
 * When that route is active, the link gets the value of its
 * activeClassName prop.
 *
 * For example, assuming you have the following route:
 *
 *   <Route path="/posts/:postID" component={Post} />
 *
 * You could use the following component to link to that route:
 *
 *   <Link to={`/posts/${post.id}`} />
 */
class Link extends React.Component {
  static displayName = 'Link'
  static contextType = RouterContext
  static propTypes = {
    to: oneOfType([ string, object, func ]),
    activeStyle: object,
    activeClassName: string,
    onlyActiveOnIndex: bool.isRequired,
    onClick: func,
    target: string,
    innerRef: oneOfType([ string, func ])
  }

  static defaultProps = {
    onlyActiveOnIndex: false,
    style: {}
  }

  handleClick = (event) => {
    if (this.props.onClick)
      this.props.onClick(event)

    if (event.defaultPrevented)
      return

    const { router } = this.context
    invariant(
      router,
      '<Link>s rendered outside of a router context cannot navigate.'
    )

    if (isModifiedEvent(event) || !isLeftClickEvent(event))
      return

    // If target prop is set (e.g. to "_blank"), let browser handle link.
    /* istanbul ignore if: untestable with Karma */
    if (this.props.target)
      return

    event.preventDefault()

    router.push(resolveToLocation(this.props.to, router))
  }

  render() {
    const { to, activeClassName, activeStyle, onlyActiveOnIndex, innerRef, ...props } = this.props

    // Ignore if rendered outside the context of router to simplify unit testing.
    const { router } = this.context

    if (router) {
      // If user does not specify a `to` prop, return an empty anchor tag.
      if (!to) { return <a {...props} ref={innerRef} /> }

      const toLocation = resolveToLocation(to, router)
      props.href = router.createHref(toLocation)

      if (activeClassName || (activeStyle != null && !isEmptyObject(activeStyle))) {
        if (router.isActive(toLocation, onlyActiveOnIndex)) {
          if (activeClassName) {
            if (props.className) {
              props.className += ` ${activeClassName}`
            } else {
              props.className = activeClassName
            }
          }

          if (activeStyle)
            props.style = { ...props.style, ...activeStyle }
        }
      }
    }

    return <a {...props} onClick={this.handleClick} ref={innerRef} />
  }
}

export default Link
