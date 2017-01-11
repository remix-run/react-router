import React, { PropTypes } from 'react'

const matchProvider = (component) => {
  return class extends React.Component {
    static displayName = `matchProvider(${component.displayName || component.name})`

    static propTypes = {
      match: PropTypes.object
    }

    static childContextTypes = {
      match: PropTypes.object
    }

    getChildContext() {
      return {
        match: this.props.match
      }
    }

    render() {
      return React.createElement(component, {
        ...this.props
      })
    }
  }
}

export default matchProvider
