import React, { PropTypes } from 'react'
import {
  historyContext as historyContextType
} from './PropTypes'

class HistoryAction extends React.Component {
  static contextTypes = {
    history: historyContextType.isRequired
  }

  static propTypes = {
    performAction: PropTypes.func.isRequired
  }

  performAction() {
    this.props.performAction(this.context.history)
  }

  componentDidMount() {
    this.performAction()
  }

  componentDidUpdate() {
    this.performAction()
  }

  render() {
    return null
  }
}

export const Push = ({ path, state }) =>
  <HistoryAction performAction={history => history.push(path, state)}/>

Push.propTypes = {
  path: PropTypes.string.isRequired,
  state: PropTypes.any
}

export const Replace = ({ path, state }) =>
  <HistoryAction performAction={history => history.replace(path, state)}/>

Replace.propTypes = Push.propTypes

export const Pop = ({ go }) =>
  <HistoryAction performAction={history => history.pop(go)}/>

Pop.propTypes = {
  go: PropTypes.number.isRequired
}
