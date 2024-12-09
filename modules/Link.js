import React from 'react'
import invariant from 'invariant'

import { routerContext } from './RouterContext'

function isLeftClickEvent(event) {
  return event.button === 0
}

function isModifiedEvent(event) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
}

// TODO: De-duplicate against hasAnyProperties in createTransitionManager.
function isEmptyObject(object) {
  for (const p in object)
    if (Object.prototype.hasOwnProperty.call(object, p)) return false

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
function Link({
  to,
  activeClassName,
  activeStyle,
  onlyActiveOnIndex = false,
  innerRef,
  style = {},
  onClick,
  target,
  ...props
}) {
  const router = React.useContext(routerContext)

  const handleClick = (event) => {
    if (onClick) onClick(event)

    if (event.defaultPrevented) return

    invariant(
      router,
      '<Link>s rendered outside of a router context cannot navigate.'
    )

    if (isModifiedEvent(event) || !isLeftClickEvent(event)) return

    // If target prop is set (e.g. to "_blank"), let browser handle link.
    /* istanbul ignore if: untestable with Karma */
    if (target) return

    event.preventDefault()

    router.push(resolveToLocation(to, router))
  }

  const propsToDrill = {
    ...props,
    style,
    onClick,
    target
  }

  // Ignore if rendered outside the context of router to simplify unit testing.
  if (router) {
    // If user does not specify a `to` prop, return an empty anchor tag.
    if (!to) {
      return <a {...propsToDrill} ref={innerRef} />
    }

    const toLocation = resolveToLocation(to, router)
    propsToDrill.href = router.createHref(toLocation)

    if (
      activeClassName ||
      (activeStyle != null && !isEmptyObject(activeStyle))
    ) {
      if (router.isActive(toLocation, onlyActiveOnIndex)) {
        if (activeClassName) {
          if (propsToDrill.className) {
            propsToDrill.className += ` ${activeClassName}`
          } else {
            propsToDrill.className = activeClassName
          }
        }

        if (activeStyle) propsToDrill.style = { ...propsToDrill.style, ...activeStyle }
      }
    }
  }

  return <a {...propsToDrill} onClick={handleClick} ref={innerRef} />
}

export default Link
