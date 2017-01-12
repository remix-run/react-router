import React, { PropTypes } from 'react'

const matchProvider = (component) => {
  return class extends React.Component {
    static displayName = `matchProvider(${component.displayName || component.name})`

    static propTypes = {
      match: PropTypes.object
    }

    static childContextTypes = {
      match: PropTypes.shape({
        listen: PropTypes.func.isRequired,
        getMatch: PropTypes.func.isRequired
      })
    }

    constructor(props) {
      super(props)

      this.listeners = []
      this.listen = this.listen.bind(this)
    }

    getChildContext() {
      return {
        match: {
          listen: this.listen,
          getMatch: () => this.props.match
        }
      }
    }

    listen(fn) {
      this.listeners.push(fn)
      return this.unlisten.bind(this, fn)
    }

    unlisten(fn) {
      this.listeners = this.listeners.filter(item => item !== fn)
    }

    componentWillReceiveProps(nextProps) {
      this.listeners.forEach(fn => { fn() })
    }

    render() {
      return React.createElement(component, {
        ...this.props
      })
    }
  }
}

export default matchProvider
