import React, { PropTypes } from 'react'

class ExampleRouter extends React.Component {

  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  static childContextTypes = {
    router: PropTypes.object.isRequired
  }

  getChildContext() {
    return {
      router: this.router
    }
  }

  componentWillMount() {
    this.router = {
      ...this.context.router,
      match: null
    }

    this.unlisten = this.router.listen(() => {
      this.router.location = this.context.router.location
    })
  }

  componentWillUnmount() {
    this.unlisten()
  }

  render() {
    const { children } = this.props
    return children ? React.Children.only(children) : null
  }
}

export default ExampleRouter
