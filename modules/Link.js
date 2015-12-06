import React from 'react'
import warning from 'warning'

const { bool, object, string, func, oneOfType } = React.PropTypes

function isLeftClickEvent(event) {
  return event.button === 0
}

function isModifiedEvent(event) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
}

function isEmptyObject(object) {
  for (let p in object)
    if (object.hasOwnProperty(p))
      return false

  return true
}

function createLocation({ to, query, hash, state }) {
  if (typeof to !== 'object') {
    return { pathname: to, query, hash, state }
  } else {
    return{ query, hash, state, ...to }
  }
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
    history: object
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
      className: '',
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
      let { state, to, query, hash } = this.props

      const location = createLocation({ to, query, hash, state })

      this.context.history.push(location)
    }
  },

  render() {
    const { to, query, hash, state, activeClassName, activeStyle, onlyActiveOnIndex, ...props } = this.props
    warning(
      query || hash || state,
      'the `query`, `hash`, and `state` props on `<Link>` are deprecated; use a location descriptor instead'
    )

    // Ignore if rendered outside the context of history, simplifies unit testing.
    const { history } = this.context

    if (history) {
      const location = createLocation({ to, query, hash, state })

      props.href = history.createHref(location, location.query)

      if (activeClassName || (activeStyle != null && !isEmptyObject(activeStyle))) {
        if (history.isActive(to, query, onlyActiveOnIndex)) {
          if (activeClassName)
            props.className += props.className === '' ? activeClassName : ` ${activeClassName}`

          if (activeStyle)
            props.style = { ...props.style, ...activeStyle }
        }
      }
    }

    return <a {...props} onClick={this.handleClick} />
  }

})

export default Link
