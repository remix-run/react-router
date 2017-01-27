import React, { PropTypes } from 'react'

/**
 * The public higher-order component API for re-rendering as the
 * location changes. Also, passes ...context.router as props.
 */
const withRouter = (component) => {
  return class extends React.Component {
    static displayName = `withRouter(${component.displayName || component.name})`

    static contextTypes = {
      router: PropTypes.shape({
        listen: PropTypes.func.isRequired
      }).isRequired
    }

    componentWillMount() {
      // Start listening here so we can <Redirect> on the initial render.
      this.unlisten = this.context.router.listen(() => this.forceUpdate())
    }

    componentWillUnmount() {
      this.unlisten()
    }

    render() {
      return React.createElement(component, {
        ...this.props,
        ...this.context.router
      })
    }
  }
}

export default withRouter
