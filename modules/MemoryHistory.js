import React, { PropTypes } from 'react'
import HistoryContext from './HistoryContext'

const clamp = (n, lowerBound, upperBound) =>
  Math.min(Math.max(n, lowerBound), upperBound)

/**
 * A history that stores its own URL entries.
 */
class MemoryHistory extends React.Component {
  static propTypes = {
    children: PropTypes.func.isRequired,
    initialEntries: PropTypes.array,
    initialIndex: PropTypes.number,
    keyLength: PropTypes.number
  }

  static defaultProps = {
    initialEntries: [ { path: '/' } ],
    initialIndex: 0,
    keyLength: 6
  }

  state = {
    entries: null,
    index: null
  }

  createKey() {
    return Math.random().toString(36).substr(2, this.props.keyLength)
  }

  handlePush = (path, state) => {
    const { entries, index } = this.state
    const key = this.createKey()

    const location = {
      path,
      state,
      key
    }

    const nextIndex = index + 1
    if (entries.length > nextIndex) {
      entries.splice(nextIndex, entries.length - nextIndex, location)
    } else {
      entries.push(location)
    }

    this.setState({
      entries,
      index: nextIndex
    })
  }

  handleReplace = (path, state) => {
    const { entries, index } = this.state
    const key = this.createKey()

    entries[index] = {
      path,
      state,
      key
    }

    this.setState({
      entries
    })
  }

  handleGo = (n) => {
    const { entries } = this.state

    this.setState({
      index: clamp(n, 0, entries.length - 1)
    })
  }

  componentWillMount() {
    const { initialEntries, initialIndex } = this.props

    this.setState({
      // Copy the array so we can mutate it.
      entries: initialEntries.slice(0),
      index: clamp(initialIndex, 0, initialEntries.length - 1)
    })
  }

  render() {
    const { children } = this.props
    const { entries, index } = this.state
    const location = entries[index]

    return (
      <HistoryContext
        children={children}
        location={location}
        push={this.handlePush}
        replace={this.handleReplace}
        go={this.handleGo}
      />
    )
  }
}

export default MemoryHistory
