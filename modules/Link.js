import React from 'react'
import warning from 'warning'

const { bool, object, string, func } = React.PropTypes

function isLeftClickEvent(event) {
  return event.button === 0
}

function isModifiedEvent(event) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
}

function isEmptyObject(object) {
  for (const p in object)
    if (object.hasOwnProperty(p))
      return false

  return true
}

/**
 * A <Link> is used to create an <a> element that links to a route.
 * When that route is active, the link gets an "active" class name
 * (or the value of its `activeClassName` prop).
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
    activeStyle: object,
    activeClassName: string,
    onlyActiveOnIndex: bool.isRequired,
    to: string.isRequired,
    query: object,
    state: object,
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
    let allowTransition = true, clickResult

    if (this.props.onClick)
      clickResult = this.props.onClick(event)

    if (isModifiedEvent(event) || !isLeftClickEvent(event))
      return

    if (clickResult === false || event.defaultPrevented === true)
      allowTransition = false

    event.preventDefault()

    if (allowTransition)
      this.context.history.pushState(this.props.state, this.props.to, this.props.query)
  },

  componentWillMount() {
    warning(
      this.context.history,
      'A <Link> should not be rendered outside the context of history ' +
      'some features including real hrefs, active styling, and navigation ' +
      'will not function correctly'
    )
  },

  render() {
    const { history } = this.context
    const { activeClassName, activeStyle, onlyActiveOnIndex, to, query, state, onClick, ...props } = this.props

    props.onClick = this.handleClick

    // Ignore if rendered outside the context
    // of history, simplifies unit testing.
    if (history) {
      props.href = history.createHref(to, query)

      if (activeClassName || (activeStyle != null && !isEmptyObject(activeStyle))) {
        if (history.isActive(to, query, onlyActiveOnIndex)) {
          if (activeClassName)
            props.className += props.className === '' ? activeClassName : ` ${activeClassName}`

          if (activeStyle)
            props.style = { ...props.style, ...activeStyle }
        }
      }
    }

    return React.createElement('a', props)
  }

})

export default Link
