import React from 'react'
import warning from './routerWarning'
import invariant from 'invariant'
import { routerShape } from './PropTypes'

const { bool, object, string, func, oneOf, oneOfType } = React.PropTypes

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

function createLocationDescriptor(to, { query, hash, state }) {
  if (query || hash || state) {
    return { pathname: to, query, hash, state }
  }

  return to
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
 *
 * By default, Links will push to history as usual, but you can instruct
 * them to replace history state instead by providing an action prop equal
 * to 'replace'
 *
 * <Link to={`/posts/${post.id}`} />
 * <Link to={`/posts/${post.id}`} action="replace" />
 *
 */
const Link = React.createClass({

  contextTypes: {
    router: routerShape
  },

  propTypes: {
    to: oneOfType([ string, object ]),
    query: object,
    hash: string,
    state: object,
    activeStyle: object,
    activeClassName: string,
    onlyActiveOnIndex: bool.isRequired,
    action: oneOf([ 'push','replace' ]).isRequired,
    onClick: func,
    target: string
  },

  getDefaultProps() {
    return {
      onlyActiveOnIndex: false,
      action: 'push',
      style: {}
    }
  },

  handleClick(event) {
    if (this.props.onClick)
      this.props.onClick(event)

    if (event.defaultPrevented)
      return

    invariant(
      this.context.router,
      '<Link>s rendered outside of a router context cannot navigate.'
    )

    if (isModifiedEvent(event) || !isLeftClickEvent(event))
      return

    // If target prop is set (e.g. to "_blank"), let browser handle link.
    /* istanbul ignore if: untestable with Karma */
    if (this.props.target)
      return

    event.preventDefault()

    const { to, query, hash, state } = this.props
    const location = createLocationDescriptor(to, { query, hash, state })

    // from enum we know it can only be 'push' or 'replace'
    this.context.router[this.props.action](location)
  },

  render() {
    const { to, query, hash, state, activeClassName, activeStyle, onlyActiveOnIndex, ...props } = this.props
    warning(
      !(query || hash || state),
      'the `query`, `hash`, and `state` props on `<Link>` are deprecated, use `<Link to={{ pathname, query, hash, state }}/>. http://tiny.cc/router-isActivedeprecated'
    )

    // Ignore if rendered outside the context of router, simplifies unit testing.
    const { router } = this.context

    if (router) {
      // If user does not specify a `to` prop, return an empty anchor tag.
      if (to == null) { return <a {...props} /> }

      const location = createLocationDescriptor(to, { query, hash, state })
      props.href = router.createHref(location)

      if (activeClassName || (activeStyle != null && !isEmptyObject(activeStyle))) {
        if (router.isActive(location, onlyActiveOnIndex)) {
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
