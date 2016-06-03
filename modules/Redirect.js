import React, { PropTypes } from 'react'

class Redirect extends React.Component {
  static propTypes = {
    to: PropTypes.string.isRequired,
    from: PropTypes.any,
    history: PropTypes.object
  }

  static contextTypes = {
    history: PropTypes.object
  }

  componentDidMount() {
    const { to, from, history } = this.props
    const providedHistory = history || this.context.history

    providedHistory.replace({
      pathname: to,
      state: { from }
    })
  }

  render() {
    return null
  }
}

export default Redirect
