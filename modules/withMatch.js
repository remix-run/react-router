import React, { PropTypes } from 'react'

const withMatch = (component) => {
  return class extends React.Component {
    static displayName = `withMatch(${component.displayName || component.name})`

    static contextTypes = {
      match: PropTypes.object
    }

    render() {
      return React.createElement(component, {
        ...this.props,
        match: this.context.match
      })
    }
  }
}

export default withMatch
