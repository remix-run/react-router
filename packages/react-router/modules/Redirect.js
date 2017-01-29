import React, { PropTypes } from 'react'

/**
 * The public API for updating the location programatically
 * with a component.
 */
class Redirect extends React.Component {
  static contextTypes = {
    router: PropTypes.shape({
      push: PropTypes.func.isRequired,
      replace: PropTypes.func.isRequired,
      staticContext: PropTypes.object
    }).isRequired
  }

  static propTypes = {
    push: PropTypes.bool,
    to: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object
    ])
  }

  static defaultProps = {
    push: false
  }

  componentWillMount() {
    if (this.context.router.staticContext)
      this.perform()
  }

  componentDidMount() {
    if (!this.context.router.staticContext)
      this.perform()
  }

  perform() {
    const { router } = this.context
    const { push, to } = this.props

    if (push) {
      router.push(to)
    } else {
      router.replace(to)
    }
  }

  render() {
    return null
  }
}

export default Redirect
