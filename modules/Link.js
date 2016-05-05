import React from 'react'

import routerLink from './routerLink'

const { bool, object, string, func, oneOfType } = React.PropTypes

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

  propTypes: {
    location: oneOfType([ string, object ]).isRequired,
    linkHref: string,
    linkActive: bool,
    activeStyle: object,
    activeClassName: string,
    onlyActiveOnIndex: bool.isRequired,
    handleClick: func.isRequired
  },

  getDefaultProps() {
    return {
      onlyActiveOnIndex: false,
      style: {}
    }
  },

  render() {
    const {
      linkActive, linkHref,  // from the HoC routerLink
      activeClassName, activeStyle, onlyActiveOnIndex,
      ...props } = this.props
    if (linkActive) {
      if (activeClassName || (activeStyle != null && !isEmptyObject(activeStyle))) {
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

    return <a {...props} href={linkHref} onClick={this.props.handleClick} />
  }

})

export default routerLink(Link)
