import { PropTypes } from 'react'

const ExampleBrowserRouter = ({ children, ...rest }, context) => (
  typeof children === 'function' ? children({ ...rest, router: context.router }) : children
)

ExampleBrowserRouter.contextTypes = {
  router: PropTypes.object
}

export default ExampleBrowserRouter
