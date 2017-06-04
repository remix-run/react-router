import React from 'react'
import PropTypes from 'prop-types'
import generatePath from './generatePath'

/**
 * The public API for updating the location programatically
 * with a component.
 */
class Redirect extends React.Component {
  static propTypes = {
    computedMatch: PropTypes.object, // private, from <Switch>
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
    if (this.isStatic())
      this.perform()
  }

  componentDidMount() {
    if (!this.isStatic())
      this.perform()
  }

  computeTo({ computedMatch, to }) {
    if (computedMatch) {
      if (typeof to === "string") {
        return generatePath(to, computedMatch.params)
      } else {
        return {
          ...to,
          pathname: generatePath(to.pathname, computedMatch.params)
        }
      }
    }
    return to
  }

  perform() {
    const { history } = this.context.router
    const { push } = this.props
    const to = this.computeTo(this.props)

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
