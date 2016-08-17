import React from 'react'
import StaticRouter from './StaticRouter'
import {
  historyContext as historyContextType
} from './PropTypes'

/**
 * A wrapper for <StaticRouter>s rendered in a react-history <HistoryContext>.
 */
const HistoryRouter = (props, context) => {
  const { history } = context

  return (
    <StaticRouter
      {...props}
      onPush={history.push}
      onReplace={history.replace}
      onGo={history.go}
    />
  )
}

HistoryRouter.contextTypes = {
  history: historyContextType.isRequired
}

export default HistoryRouter
