import React, { PropTypes } from 'react'

class Redirect extends React.Component {
  static defaultProps = {
    push: false
  }

  static contextTypes = {
    router: PropTypes.object,
    serverRouter: PropTypes.bool
  }

  isServerRender() {
    return this.context.serverRouter
  }

  componentWillMount() {
    if (this.isServerRender())
      this.redirect(this.props)
  }

  componentDidMount() {
    if (!this.isServerRender())
      this.redirect(this.props)
  }

  componentWillReceiveProps(nextProps) {
    // TODO: use looseEqual from history/LocationUtils
    // so we can allow for objects here
    if (nextProps.to !== this.props.to) {
      this.redirect(nextProps)
    }
  }

  redirect(props) {
    const { router } = this.context
    const { to, push } = props
    const navigate = push ? router.transitionTo : router.replaceWith
    navigate(to)
  }

  render() {
    return null
  }
}

if (__DEV__) {
  Redirect.propTypes = {
    to: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object
    ]).isRequired,
    push: PropTypes.bool
  }
}

export default Redirect
