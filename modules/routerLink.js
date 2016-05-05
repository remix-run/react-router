import React from 'react'
import warning from './routerWarning'

import hoistStatics from 'hoist-non-react-statics'

import { routerShape } from './PropTypes'

const { bool, object, string, func, oneOfType } = React.PropTypes

function isLeftClickEvent(event) {
  return event.button === 0
}

function isModifiedEvent(event) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
}

function createLocationDescriptor(to, { query, hash, state }) {
  if (query || hash || state) {
    return { pathname: to, query, hash, state }
  }

  return to
}

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component'
}

export default function routerLink(WrappedComponent) {
  const RouterLink = React.createClass({

    contextTypes: {
      router: routerShape
    },

    propTypes: {
      to: oneOfType([ string, object ]).isRequired,
      query: object,
      hash: string,
      state: object,
      onlyActiveOnIndex: bool.isRequired,
      onClick: func,
      target: string
    },

    displayName: `routerLink(${getDisplayName(WrappedComponent)})`,
    WrappedComponent: WrappedComponent,

    getDefaultProps() {
      return {
        onlyActiveOnIndex: false
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
        const { to, query, hash, state } = this.props
        const location = createLocationDescriptor(to, { query, hash, state })

        this.context.router.push(location)
      }
    },

    render() {
      const { to, query, hash, state, onlyActiveOnIndex, ...props } = this.props
      warning(
        !(query || hash || state),
        'the `query`, `hash`, and `state` props on `<Link>` are deprecated, use `<Link to={{ pathname, query, hash, state }}/>. http://tiny.cc/router-isActivedeprecated'
      )

      // Ignore if rendered outside the context of router, simplifies unit testing.
      const { router } = this.context

      props.location = createLocationDescriptor(to, { query, hash, state })
      if (router) {
        props.linkHref = router.createHref(props.location)
        props.linkActive = router.isActive(props.location, onlyActiveOnIndex)
      }

      return (
          <WrappedComponent
            {...props}
            handleClick={this.handleClick}
          />
      )
    }

  })

  return hoistStatics(RouterLink, WrappedComponent)
}
