import warning from 'warning'
import React, { PropTypes } from 'react'
import { locationsAreEqual } from './LocationUtils'
import {
  action as actionType,
  historyLocation as historyLocationType,
  historyContext as historyContextType
} from './PropTypes'

/**
 * The common public API for all *History components.
 */
class HistoryContext extends React.Component {
  static propTypes = {
    children: PropTypes.func.isRequired,
    action: actionType.isRequired,
    location: historyLocationType.isRequired,
    confirm: PropTypes.func,
    push: PropTypes.func.isRequired,
    replace: PropTypes.func.isRequired,
    go: PropTypes.func.isRequired,
    revert: PropTypes.func.isRequired
  }

  static defaultProps = {
    confirm: (callback) => callback(true)
  }

  static childContextTypes = {
    history: historyContextType.isRequired
  }

  getChildContext() {
    const { push, replace, go, revert } = this.props

    return {
      history: {
        push,
        replace,
        go,
        revert,
        block: this.block
      }
    }
  }

  block = (prompt) => {
    warning(
      this.prompt == null,
      'You should not render more than one <NavigationPrompt> at a time; previous ones will be overwritten'
    )

    this.prompt = prompt

    return () => {
      if (this.prompt === prompt)
        this.prompt = null
    }
  }

  state = {
    action: null,
    location: null
  }

  componentWillMount() {
    this.isBlocked = false

    const { action, location } = this.props

    this.setState({
      action,
      location
    })
  }

  componentWillReceiveProps(nextProps) {
    const { action, location } = nextProps

    if (!locationsAreEqual(this.props.location, location)) {
      if (this.isBlocked) {
        // Unblock after a revert.
        this.isBlocked = false
      } else {
        this.isBlocked = true

        this.confirmTransition(action, location, (ok) => {
          if (ok) {
            this.isBlocked = false

            this.setState({
              action,
              location
            })
          } else {
            // Remain blocked so we ignore the next prop change as well.
            this.props.revert()
          }
        })
      }
    }
  }

  confirmTransition(action, location, callback) {
    const prompt = this.prompt

    if (typeof prompt === 'function') {
      prompt({ action, location }, callback)
    } else if (typeof prompt === 'string') {
      this.props.confirm(prompt, callback)
    } else {
      callback(true)
    }
  }

  shouldComponentUpdate() {
    return !this.isBlocked
  }

  render() {
    const { action, location } = this.state

    return this.props.children({
      action,
      location
    })
  }
}

export default HistoryContext
