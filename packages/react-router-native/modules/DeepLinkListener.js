import React, { Component, PropTypes } from 'react'
import { Linking } from 'react-native'

class DeepLinkListener extends Component {
  static contextTypes = {
    router: PropTypes.object
  }

  componentDidMount() {
    Linking.addEventListener('url', this.handleDeepLink)
  }

  componentWillUnmount() {
    Linking.removeEventListener('url', this.handleDeepLink)
  }

  handleDeepLink = (e) => {
    const url = e.url.replace(/.*?:\/\//g, "")
    this.context.router.transitionTo(url)
  }

  render() {
    return null
  }
}

export default DeepLinkListener

