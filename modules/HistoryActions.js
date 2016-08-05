import React, { PropTypes } from 'react'
import {
  historyContext as historyContextType
} from './PropTypes'

class HistoryAction extends React.Component {
  static contextTypes = {
    history: historyContextType.isRequired
  }

  static propTypes = {
    onMount: PropTypes.func.isRequired
  }

  componentDidMount() {
    this.props.onMount(this.context.history)
  }

  render() {
    return null
  }
}

export const Push = ({ path, state }) =>
  <HistoryAction onMount={history => history.push(path, state)}/>

export const Replace = ({ path, state }) =>
  <HistoryAction onMount={history => history.replace(path, state)}/>

export const Pop = ({ n }) =>
  <HistoryAction onMount={history => history.pop(n)}/>
