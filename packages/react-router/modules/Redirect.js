import React from 'react'
import PropTypes from 'prop-types'
import invariant from 'invariant'

/**
 * The public API for updating the location programatically
 * with a component.
 */
class Redirect extends React.Component {
  static propTypes = {
    push: PropTypes.bool,
    from: PropTypes.string,
    to: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object
    ])
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
