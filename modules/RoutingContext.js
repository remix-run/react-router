import React, { Component } from 'react'
import RoutingRenderer from './RoutingRenderer'

const { array, func, object } = React.PropTypes

/**
 * A <RoutingContext> applies middlewares for rendering the router state and
 * the history object and the current location in context.
 */
class RoutingContext extends Component {

  static propTypes = {
    history: object.isRequired,
    createElement: func.isRequired,
    middlewares: array,
    location: object.isRequired
  }

  static defaultProps = {
    createElement: React.createElement
  }

  static childContextTypes = {
    history: object.isRequired,
    location: object.isRequired
  }

  getChildContext() {
    const { history, location } = this.props
    return { history, location }
  }

  render() {
    const { middlewares, ...props } = this.props

    let element = React.createElement(RoutingRenderer, props)
    if (middlewares) {
      element = middlewares.reduceRight((children, middleware) => (
        React.cloneElement(middleware, { ...props, children })
      ), element)
    }

    return element
  }

}

export default RoutingContext
