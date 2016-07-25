import React from 'react'
import invariant from 'invariant'
import { routerShape } from './PropTypes'
import { ContextSubscriber } from './ContextUtils'

const { bool, object, string, func, oneOfType } = React.PropTypes

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
 *
 * Links may pass along location state and/or query string parameters
 * in the state/query props, respectively.
 *
 *   <Link ... query={{ show: true }} state={{ the: 'state' }} />
 */
const Link = React.createClass({

  mixins: [ ContextSubscriber('router') ],

  contextTypes: {
    router: routerShape
  },

  propTypes: {
    to: oneOfType([ string, object, func ]).isRequired,
    query: object,
    hash: string,
    state: object,
    activeStyle: object,
    activeClassName: string,
    onlyActiveOnIndex: bool.isRequired,
    onClick: func,
    target: string
  },

  getDefaultProps() {
    return {
      onlyActiveOnIndex: false,
      style: {}
    }
  },

  handleClick(event) {
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
  },

  render() {
    const { to, activeClassName, activeStyle, onlyActiveOnIndex, ...props } = this.props

    // Ignore if rendered outside the context of router to simplify unit testing.
    const { router } = this.context

    if (router) {
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

    return <a {...props} onClick={this.handleClick} />
  }

})

export default Link
