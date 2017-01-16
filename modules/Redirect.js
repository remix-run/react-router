import React, { PropTypes } from 'react'

/**
 * The public API for updating the location programatically
 * with a component.
 */
class Redirect extends React.Component {
  static contextTypes = {
    router: PropTypes.shape({
      history: PropTypes.shape({
        push: PropTypes.func.isRequired,
        replace: PropTypes.func.isRequired,
        isServer: PropTypes.bool
      }).isRequired
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
    if (this.context.router.history.isServer)
      this.perform()
  }

  componentDidMount() {
    if (!this.context.router.history.isServer)
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
