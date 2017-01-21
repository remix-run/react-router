import React, { Component, PropTypes } from 'react'
import MemoryRouter from 'react-router/MemoryRouter'
import { AsyncStorage } from 'react-native'

class StoreHistory extends React.Component {
  static contextTypes = {
    history: PropTypes.object
  }

  componentDidMount() {
    this.store()
  }

  componentDidUpdate() {
    this.store()
  }

  store() {
    const { entries, index } = this.context.history
    AsyncStorage.setItem('history', JSON.stringify({ entries, index }))
  }

  render() {
    return this.props.children
  }
}

class NativeRouter extends React.Component {
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
    const { children } = this.props
    const { savedHistory } = this.state
    return savedHistory != null ? (
      <MemoryRouter
        initialEntries={savedHistory.entries}
        initialIndex={savedHistory.index}
      >
        {({ location, ...rest }) => (
          <StoreHistory>
            {typeof children === 'function' ? (
              children({ location, ...rest })
            ) : (
              children
            )}
          </StoreHistory>
        )}
      </MemoryRouter>
    ) : null
  }
}

export default NativeRouter
