import React from 'react'
import PropTypes from 'prop-types'
import { BackHandler } from 'react-native'

class BackButton extends React.Component {
  static contextTypes = {
    router: PropTypes.shape({
      history: PropTypes.shape({
        goBack: PropTypes.func.isRequired,
        index: PropTypes.number.isRequired
      }).isRequired
    }).isRequired
  }

  componentDidMount() {
    BackHandler.addEventListener('hardwareBackPress', this.handleBack)
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.handleBack)
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
    return this.props.children || null
  }
}

export default BackButton
