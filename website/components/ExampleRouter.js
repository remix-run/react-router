import React, { PropTypes } from 'react'

const ExampleRouter = ({ children }, context) => (
  typeof children === 'function' ? (
    children({
      action: context.history.action,
      location: context.history.location,
      history: context.history
    })
  ) : (
    React.Children.only(children)
  )
)

ExampleRouter.contextTypes = {
  history: PropTypes.object
}

export default ExampleRouter
