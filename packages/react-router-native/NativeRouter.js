import React, { PropTypes, Component } from 'react'
import MemoryRouter from 'react-router/MemoryRouter'
import Route from 'react-router/Route'
import { AsyncStorage, Alert } from 'react-native'

/**
 * The public API for a <Router> designed for React Native. Stores
 * locations using AsyncStorage and prompts using Alert.
 */
class NativeRouter extends Component {
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
          entries: this.props.initialEntries,
          index: this.props.initialIndex
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
        <Route render={({ entries, index }) => (
          <StoreHistory entries={entries} index={index}>
            {React.Children.only(children)}
          </StoreHistory>
        )}/>
      </MemoryRouter>
    ) : null
  }
}

class StoreHistory extends Component {
  static propTypes = {
    index: PropTypes.number.isRequired,
    entries: PropTypes.array.isRequired
  }

  componentDidMount() {
    this.store()
  }

  componentDidUpdate() {
    this.store()
  }

  store() {
    const { entries, index } = this.props
    AsyncStorage.setItem(
      'history',
      JSON.stringify({ entries, index })
    )
  }

  render() {
    return this.props.children
  }
}

export default NativeRouter
