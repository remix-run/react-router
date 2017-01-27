import React, { Component, PropTypes } from 'react'
import { Linking, Platform } from 'react-native'

const regex = Platform.OS === 'android' ? (
  /.*?:\/\/.*?\//g
) : (
  /.*?:\/\//g
)

class DeepLinking extends Component {
  static contextTypes = {
    router: PropTypes.object
  }

  async componentDidMount() {
    const url = await Linking.getInitialURL()
    if (url)
      this.push(url)
    Linking.addEventListener('url', this.handleChange)
  }

  componentWillUnmount() {
    Linking.removeEventListener('url', this.handleChange)
  }

  handleChange = (e) => {
    this.push(e.url)
  }

  push = (url) => {
    const pathname = url.replace(regex, '')
    this.context.router.push(pathname)
  }

  render() {
    return null
  }
}

export default DeepLinking
