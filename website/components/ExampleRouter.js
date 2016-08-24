import React from 'react'
import StaticRouter from '../../modules/StaticRouter'

const ExampleRouter = (props, { history, location, action }) => (
  <StaticRouter
    action={action}
    location={location}
    onPush={history.push}
    onReplace={history.replace}
    blockTransitions={history.block}
    {...props}
  />
)

ExampleRouter.contextTypes = {
  history: React.PropTypes.object,
  location: React.PropTypes.object,
  action: React.PropTypes.string
}

export default ExampleRouter
