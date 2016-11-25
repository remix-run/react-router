import { PropTypes } from 'react'

const ExampleRouter = ({ children, ...rest }, context) => (
  typeof children === 'function' ? children({ ...rest, router: context.router }) : children
)

ExampleRouter.contextTypes = {
  router: PropTypes.object
}

export default ExampleRouter
