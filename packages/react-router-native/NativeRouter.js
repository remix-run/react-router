import React, { PropTypes } from 'react'
import MemoryRouter from 'react-router/MemoryRouter'
import { AsyncStorage, Alert } from 'react-native'

class StoreHistory extends React.Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  static propTypes = {
    initialIndex: PropTypes.number,
    initialEntries: PropTypes.array
  }

  static defaultProps = {
    initialIndex: 0,
    initialEntries: [ '/' ]
  }

  componentDidMount() {
    this.store()
  }

  componentDidUpdate() {
    this.store()
  }

  store() {
    const { router: { entries, index } } = this.context
    AsyncStorage.setItem('history', JSON.stringify({ entries, index }))
  }

  render() {
    return this.props.children
  }
}

/**
 * The public API for a <Router> designed for React Native. Stores
 * locations using AsyncStorage and prompts using Alert.
 */
class NativeRouter extends React.Component {
  static propTypes = {
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
    const { getUserConfirmation, keyLength, children } = this.props

    return (
      <MemoryRouter
        initialEntries={this.props.initialEntries}
        initialIndex={this.props.initialIndex}
        getUserConfirmation={getUserConfirmation}
        keyLength={keyLength}
      >
        <StoreHistory>
          {React.Children.only(children)}
        </StoreHistory>
      </MemoryRouter>
    )
  }
}

export default NativeRouter
