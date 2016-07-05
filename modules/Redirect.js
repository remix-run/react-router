import React, { PropTypes } from 'react'

class Redirect extends React.Component {
  static propTypes = {
    to: PropTypes.string.isRequired,
    history: PropTypes.object
  }

  static contextTypes = {
    history: PropTypes.object,
    location: PropTypes.object
  }

  componentWillMount() {
    const { to, history } = this.props
    const providedHistory = history || this.context.history
    providedHistory.replace(to)
  }

  render() {
    return null
  }
}

export default Redirect
