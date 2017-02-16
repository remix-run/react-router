import React from 'react'
import PropTypes from 'prop-types'
import resolveLocation from './resolveLocation'

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
      route: PropTypes.shape({
        match: PropTypes.shape({
          url: PropTypes.string
        })
      }),
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

  perform() {
    const { history, route } = this.context.router
    const { push, to } = this.props
    const base = route.match && route.match.url ? route.match.url : ''
    const loc = resolveLocation(to, base)
    if (push) {
      history.push(loc)
    } else {
      history.replace(loc)
    }
  }

  render() {
    return null
  }
}

export default Redirect
