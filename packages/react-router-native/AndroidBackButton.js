import React, { Component, PropTypes } from 'react'
import { BackAndroid } from 'react-native'

class AndroidBackButton extends Component {
  static contextTypes = {
    router: PropTypes.shape({
      history: PropTypes.shape({
        goBack: PropTypes.func.isRequired,
        index: PropTypes.number.isRequired
      }).isRequired
    }).isRequired
  }

  componentDidMount() {
    BackAndroid.addEventListener('hardwareBackPress', this.handleBack)
  }

  componentWillUnmount() {
    BackAndroid.removeEventListener('hardwareBackPress', this.handleBack)
  }

  handleBack = () => {
    const { history } = this.context.router
    if (history.index === 0) {
      return false // home screen
    } else {
      history.goBack()
      return true
    }
  }

  render() {
    return this.props.children
  }
}

export default AndroidBackButton
