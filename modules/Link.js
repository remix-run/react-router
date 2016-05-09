import React from 'react'
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
    to: oneOfType([ string, object ]).isRequired,
    query: object,
    hash: string,
    state: object,
    activeStyle: object,
    activeClassName: string,
    onlyActiveOnIndex: bool.isRequired,
    onClick: func
  },

  getDefaultProps() {
    return {
      onlyActiveOnIndex: false,
      style: {}
    }
  },

  handleClick(event) {
    let allowTransition = true

    if (this.props.onClick)
      this.props.onClick(event)

    if (isModifiedEvent(event) || !isLeftClickEvent(event))
      return

    if (event.defaultPrevented === true)
      allowTransition = false

    // If target prop is set (e.g. to "_blank") let browser handle link.
    /* istanbul ignore if: untestable with Karma */
    if (this.props.target) {
      if (!allowTransition)
        event.preventDefault()

      return
    }

    event.preventDefault()

    if (allowTransition) {
      const { to } = this.props

      this.context.router.push(to)
    }
  },

  render() {
    const { to, activeClassName, activeStyle, onlyActiveOnIndex, ...props } = this.props
    // Ignore if rendered outside the context of router, simplifies unit testing.
    const { router } = this.context

    if (router) {
      props.href = router.createHref(to)

      if (activeClassName || (activeStyle != null && !isEmptyObject(activeStyle))) {
        if (router.isActive(to, onlyActiveOnIndex)) {
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
