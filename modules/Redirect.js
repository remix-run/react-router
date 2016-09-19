import React, { PropTypes } from 'react'
import {
  routerContext as routerContextType
} from './PropTypes'

class Redirect extends React.Component {
  static defaultProps = {
    push: false
  }

  static contextTypes = {
    router: routerContextType,
    serverRouter: PropTypes.object
  }

  componentWillMount() {
    if (this.context.serverRouter)
      this.redirect()
  }

  componentDidMount() {
    this.redirect()
  }

  redirect() {
    const { router } = this.context
    const { to, push } = this.props
    // so that folks can unit test w/o hassle
    if (router) {
      const navigate = push ? router.transitionTo : router.replaceWith
      navigate(to)
    }
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
