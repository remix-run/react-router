import React, { PropTypes } from 'react'
import StaticRouter from './StaticRouter'

const ignoreFirstCall = (fn) => {
  let called = false
  return (...args) => {
    if (called) {
      fn(...args)
    } else {
      called = true
    }
  }
}

class ServerRouter extends React.Component {
  constructor(props) {
    super(props)
    const { context } = props
    context.missed = true
    context.redirect = null
  }

  // ignore first call because StaticRouter renders a <Match>,
  // so we ignore that one.
  handleMatch = ignoreFirstCall(() => {
    this.props.context.missed = false
  })

  handleRedirect = (location) => {
    // only take the first redirect
    if (!this.props.context.redirect)
      this.props.context.redirect = location
  }

  render() {
    const { location, basename, ...rest } = this.props
    return (
      <StaticRouter
        action="POP"
        location={location}
        basename={basename}
        onReplace={this.handleRedirect}
        onPush={this.handleRedirect}
        onMatch={this.handleMatch}
        {...rest}
      />
    )
  }
}

if (__DEV__) {
  ServerRouter.propTypes = {
    basename: PropTypes.string,
    context: PropTypes.object.isRequired,
    location: PropTypes.string.isRequired,
    children: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.node
    ])
  }
}

export default ServerRouter
