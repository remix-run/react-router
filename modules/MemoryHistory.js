import warning from 'warning'
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
    prevIndex: null,
    action: null,
    index: null,
    entries: null
  }

  createKey() {
    return Math.random().toString(36).substr(2, this.props.keyLength)
  }

  handlePush = (path, state) => {
    this.setState(prevState => {
      const prevIndex = prevState.index
      const entries = prevState.entries.slice(0)

      const key = this.createKey()
      const location = {
        path,
        state,
        key
      }

      const nextIndex = prevIndex + 1
      if (entries.length > nextIndex) {
        entries.splice(nextIndex, entries.length - nextIndex, location)
      } else {
        entries.push(location)
      }

      return {
        prevIndex: prevState.index,
        action: 'PUSH',
        index: nextIndex,
        entries
      }
    })
  }

  handleReplace = (path, state) => {
    this.setState(prevState => {
      const prevIndex = prevState.index
      const entries = prevState.entries.slice(0)
      const key = this.createKey()

      entries[prevIndex] = {
        path,
        state,
        key
      }

      return {
        prevIndex: prevState.index,
        action: 'REPLACE',
        entries
      }
    })
  }

  handleGo = (n) => {
    this.setState(prevState => {
      const prevIndex = prevState.index
      const nextIndex = clamp(prevIndex + n, 0, prevState.entries.length - 1)

      return {
        prevIndex,
        action: 'POP',
        index: nextIndex
      }
    })
  }

  handleRevert = () => {
    const { prevIndex } = this.state

    if (prevIndex != null) {
      this.setState({
        prevIndex: null,
        action: 'POP',
        index: prevIndex
      })
    } else {
      warning(
        false,
        '<MemoryHistory> cannot revert more than one entry'
      )
    }
  }

  componentWillMount() {
    const { initialEntries, initialIndex } = this.props

    this.setState({
      action: 'POP',
      index: clamp(initialIndex, 0, initialEntries.length - 1),
      entries: initialEntries
    })
  }

  render() {
    const { children } = this.props
    const { action, index, entries } = this.state
    const location = entries[index]

    return (
      <HistoryContext
        children={children}
        action={action}
        location={location}
        push={this.handlePush}
        replace={this.handleReplace}
        go={this.handleGo}
        revert={this.handleRevert}
      />
    )
  }
}

export default MemoryHistory
