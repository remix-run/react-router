import React from 'react'

const ExampleRouter = ({ children }, { router }) => (
  typeof children === 'function' ? children({ router }) : children
)

ExampleRouter.contextTypes = { router: React.PropTypes.object }

export default ExampleRouter
