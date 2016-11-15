import React, { PropTypes } from 'react'

class NavigationPrompt extends React.Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  static defaultProps = {
    when: true
  }

  block() {
    if (!this.teardownPrompt)
      this.teardownPrompt = this.context.router.blockTransitions(this.props.message)
  }

  unblock() {
    if (this.teardownPrompt) {
      this.teardownPrompt()
      delete this.teardownPrompt
    }
  }

  componentWillMount() {
    if (this.props.when)
      this.block()
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.when === true && this.props.when === false) {
      this.block()
    } else if (nextProps.when === false && this.props.when === true) {
      this.unblock()
    }
  }

  componentWillUnmount() {
    this.unblock()
  }

  render() {
    return null
  }
}

if (__DEV__) {
  NavigationPrompt.propTypes = {
    when: PropTypes.bool,
    message: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.string
    ]).isRequired
  }
}

export default NavigationPrompt
