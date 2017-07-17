import React from 'react'
import PropTypes from 'prop-types'
import warning from 'warning'
import invariant from 'invariant'
import { locationsAreEqual } from 'history'

/**
 * The public API for updating the location programmatically
 * with a component.
 */
class Redirect extends React.Component {
  static propTypes = {
    push: PropTypes.bool,
    from: PropTypes.string,
    to: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object
    ]).isRequired
  }

  static defaultProps = {
    push: false
  }

  static contextTypes = {
    router: PropTypes.shape({
      history: PropTypes.shape({
        push: PropTypes.func.isRequired,
        replace: PropTypes.func.isRequired
      }).isRequired,
      staticContext: PropTypes.object
    }).isRequired
  }

  isStatic() {
    return this.context.router && this.context.router.staticContext
  }

  componentWillMount() {
    invariant(
      this.context.router,
      'You should not use <Redirect> outside a <Router>'
    )

    if (this.isStatic())
      this.perform()
  }

  componentDidMount() {
    if (!this.isStatic())
      this.perform()
  }

  componentDidUpdate(prevProps) {
    let prevTo = prevProps.to
    let nextTo = this.props.to

    prevTo = typeof prevTo === 'string' ? { pathname: prevTo } : prevTo
    nextTo = typeof nextTo === 'string' ? { pathname: nextTo } : nextTo

    if (locationsAreEqual(prevTo, nextTo))
      return warning(
        false,
        `You tried to redirect to the same route you're currently on: "%s%s"`,
        nextTo.pathname,
        nextTo.search || ''
      )

    this.perform()
  }

  perform() {
    const { history } = this.context.router
    const { push, to } = this.props

    if (push) {
      history.push(to)
    } else {
      history.replace(to)
    }
  }

  render() {
    return null
  }
}

export default Redirect
