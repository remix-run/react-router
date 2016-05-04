import React from 'react'
import { routerShape } from './PropTypes'

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

function isLinkActive(router, props) {
  // Ignore if rendered outside the context of router, simplifies unit testing.
  if (!router) {
    return false
  }

  // Ignore if the render output is unaffected by the active state.
  const { to, activeClassName, activeStyle, onlyActiveOnIndex } = props
  if (!activeClassName && (activeStyle == null || isEmptyObject(activeStyle))) {
    return false
  }

  return router.isActive(to, onlyActiveOnIndex)
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

  getInitialState() {
    return {
      isActive: isLinkActive(this.context.router, this.props)
    }
  },

  componentWillMount() {
    this._isActive = this.state.isActive
  },

  componentDidMount() {
    const { router } = this.context
    if (router) {
      this._unlisten = router.listen(() => {
        if (this._unlisten) {
          this.updateIsActive()
        }
      })
    }
  },

  componentWillReceiveProps(nextProps) {
    const { router } = this.context
    if (router) {
      if (
        nextProps.to !== this.props.to ||
        nextProps.onlyActiveOnIndex !== this.props.onlyActiveOnIndex ||
        nextProps.activeClassName !== this.props.activeClassName ||
        nextProps.activeStyle !== this.props.activeStyle
      ) {
        this.updateIsActive(nextProps)
      }
    }
  },

  componentWillUnmount() {
    if (this._unlisten) {
      this._unlisten()
      this._unlisten = null
    }
  },

  updateIsActive(props = this.props) {
    const { router } = this.context
    const isActive = isLinkActive(router, props)

    // The code is written this way to avoid wasted
    // setState() calls that get expensive in large trees.
    if (isActive !== this._isActive) {
      this._isActive = isActive
      this.setState({ isActive: this._isActive })
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
    const { to, activeClassName, activeStyle, ...props } = this.props
    const { router } = this.context
    const { isActive } = this.state

    // Ignore if rendered outside the context of router, simplifies unit testing.
    if (router) {
      props.href = router.createHref(to)

      if (isActive) {
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

    return <a {...props} onClick={this.handleClick} />
  }

})

export default Link
