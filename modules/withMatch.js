import React, { PropTypes } from 'react'

const withMatch = (component) => {
  return class extends React.Component {
    static displayName = `withMatch(${component.displayName || component.name})`

    static contextTypes = {
      match: PropTypes.shape({
        listen: PropTypes.func.isRequired,
        getMatch: PropTypes.func.isRequired
      }).isRequired
    }

    componentWillMount() {
      this.unlisten = this.context.match.listen(() => this.forceUpdate())
    }

    componentWillUnmount() {
      this.unlisten()
    }

    render() {
      return React.createElement(component, {
        ...this.props,
        match: this.context.match.getMatch()
      })
    }
  }
}

export default withMatch
