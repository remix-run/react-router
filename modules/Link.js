import React from 'react'

const { bool, object, string, func } = React.PropTypes

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

/**
 * A <Link> is used to create an <a> element that links to a route.
 * When that route is active, the link gets the value of its
 * `activeClassName` prop
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
class Link extends React.Component {

  static contextTypes = {
    history: object
  }

  static propTypes = {
    to: string.isRequired,
    query: object,
    hash: string,
    state: object,
    activeStyle: object,
    activeClassName: string,
    onlyActiveOnIndex: bool.isRequired,
    onClick: func
  }

  static defaultProps = {
    onlyActiveOnIndex: false,
    className: '',
    style: {}
  }

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
  }

  render() {
    const { to, query, hash, state, activeClassName, activeStyle, onlyActiveOnIndex, ...props } = this.props

    // Manually override onClick.
    props.onClick = (e) => this.handleClick(e)

    // Ignore if rendered outside the context of history, simplifies unit testing.
    const { history } = this.context
    if (history) {
      props.href = history.createHref(to, query)

      if (hash)
        props.href += hash

      if (activeClassName || (activeStyle != null && !isEmptyObject(activeStyle))) {
        if (history.isActive(to, query, onlyActiveOnIndex)) {
          if (activeClassName)
            props.className += props.className === '' ? activeClassName : ` ${activeClassName}`

          if (activeStyle)
            props.style = { ...props.style, ...activeStyle }
        }
      }
    }

    return <a {...props} />
  }

}

export default Link
