import React, { PropTypes } from 'react'
import {
  historyContext as historyContextType
} from './PropTypes'

class HistoryAction extends React.Component {
  static contextTypes = {
    history: historyContextType.isRequired
  }

  static propTypes = {
    perform: PropTypes.func.isRequired
  }

  componentWillMount() {
    this.props.perform(this.context.history)
  }

  componentWillReceiveProps(nextProps) {
    nextProps.perform(this.context.history)
  }

  render() {
    return null
  }
}

export const Push = ({ path, state }) =>
  <HistoryAction perform={history => history.push(path, state)}/>

Push.propTypes = {
  path: PropTypes.string.isRequired,
  state: PropTypes.any
}

export const Replace = ({ path, state }) =>
  <HistoryAction perform={history => history.replace(path, state)}/>

Replace.propTypes = Push.propTypes

export const Pop = ({ go }) =>
  <HistoryAction perform={history => history.go(go)}/>

Pop.propTypes = {
  go: PropTypes.number
}

Pop.defaultProps = {
  go: -1
}

export const Revert = () =>
  <HistoryAction perform={history => history.revert()}/>
