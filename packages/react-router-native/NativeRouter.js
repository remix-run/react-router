import React, { PropTypes } from 'react'
import MemoryRouter from 'react-router/MemoryRouter'
import { AsyncStorage, Alert } from 'react-native'

class StoreHistory extends React.Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
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

  state = {
    savedHistory: null
  }

  componentDidMount() {
    AsyncStorage.getItem('history', (err, history) => {
      this.setState({
        savedHistory: history ? JSON.parse(history) : {
          entries: [ '/' ],
          index: 0
        }
      })
    })
  }

  render() {
    const { getUserConfirmation, keyLength, children } = this.props
    const { savedHistory } = this.state

    return savedHistory != null ? (
      <MemoryRouter
        initialEntries={savedHistory.entries}
        initialIndex={savedHistory.index}
        getUserConfirmation={getUserConfirmation}
        keyLength={keyLength}
      >
        <StoreHistory>
          {React.Children.only(children)}
        </StoreHistory>
      </MemoryRouter>
    ) : null
  }
}

export default NativeRouter
