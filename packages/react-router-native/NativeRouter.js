import React, { PropTypes } from 'react'
import MemoryRouter from 'react-router/MemoryRouter'
import { Alert } from 'react-native'

/**
 * The public API for a <Router> designed for React Native. Gets
 * user confirmations via Alert by default.
 */
class NativeRouter extends React.Component {
  static propTypes = {
    initialEntries: PropTypes.array,
    initialIndex: PropTypes.number,
    getUserConfirmation: PropTypes.func,
    keyLength: PropTypes.number,
    children: PropTypes.node
  }

  static defaultProps = {
    getUserConfirmation: (message, callback) => {
      Alert.alert('Confirm', message, [
        { text: 'Cancel', onPress: () => callback(false) },
        { text: 'OK', onPress: () => callback(true) }
      ])
    }
  }

  render() {
    return <MemoryRouter {...this.props}/>
  }
}

export default NativeRouter
