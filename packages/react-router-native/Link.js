import React, { Component, PropTypes } from 'react'
import { TouchableHighlight } from 'react-native'

class Link extends Component {
  static contextTypes = {
    history: React.PropTypes.object
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
    const { history } = this.context
    const { to, replace } = this.props

    if (replace) {
      history.replace(to)
    } else {
      history.push(to)
    }
  }

  render() {
    const { component: Component, ...rest } = this.props
    return <Component {...rest} onPress={this.handlePress}/>
  }
}

export default Link
