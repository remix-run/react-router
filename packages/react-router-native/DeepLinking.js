import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Linking } from 'react-native'

const regex = /.*?:\/\//g

class DeepLinking extends Component {
  static contextTypes = {
    router: PropTypes.shape({
      history: PropTypes.shape({
        push: PropTypes.func.isRequired
      }).isRequired
    }).isRequired
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
    this.context.router.history.push(pathname)
  }

  render() {
    return this.props.children
  }
}

export default DeepLinking
