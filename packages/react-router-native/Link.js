import React, { Component, PropTypes } from 'react'
import { TouchableHighlight } from 'react-native'

class Link extends Component {
  static contextTypes = {
    router: React.PropTypes.object
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
    const { router } = this.context
    const { to, replace } = this.props

    if (replace) {
      router.replace(to)
    } else {
      router.push(to)
    }
  }

  render() {
    const { component: Component, ...rest } = this.props
    return <Component {...rest} onPress={this.handlePress}/>
  }
}

export default Link
