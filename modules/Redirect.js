import React, { PropTypes } from 'react'
import {
  routerContext as routerContextType
} from './PropTypes'

class Redirect extends React.Component {
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
    // so that folks can unit test w/o hassle
    if (router)
      router.replaceWith(this.props.to)
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
    ]).isRequired
  }
}

export default Redirect
