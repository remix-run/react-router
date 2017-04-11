import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { TouchableHighlight } from 'react-native'

class Link extends Component {
  static contextTypes = {
    router: PropTypes.shape({
      history: PropTypes.shape({
        push: PropTypes.func.isRequired,
        replace: PropTypes.func.isRequired
      }).isRequired
    }).isRequired
  }

  static propTypes = {
    component: PropTypes.func,
    replace: PropTypes.bool,
    to: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object
    ])
  }

  static defaultProps = {
    component: TouchableHighlight,
    replace: false
  }

  handlePress = () => {
    const { history } = this.context.router
    const { to, replace } = this.props

    if (replace) {
      history.replace(to)
    } else {
      history.push(to)
    }
  }

  render() {
    const { component: Component, to, replace, ...rest } = this.props
    return <Component {...rest} onPress={this.handlePress}/>
  }
}

export default Link
