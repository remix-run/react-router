import React, { Component, PropTypes } from 'react'
import { BackAndroid } from 'react-native'

class BackButton extends Component {
  static contextTypes = {
    router: PropTypes.object
  }

  componentDidMount() {
    BackAndroid.addEventListener('hardwareBackPress', this.handleBack)
  }

  componentWillUnmount() {
    BackAndroid.removeEventListener('hardwareBackPress', this.handleBack)
  }

  handleBack = () => {
    const { router } = this.context
    if (router.index === 0) {
      return false // home screen
    } else {
      router.goBack()
      return true
    }
  }

  render() {
    return null
  }
}

export default BackButton
