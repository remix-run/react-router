import React, { Component, PropTypes } from 'react'
import { TouchableHighlight } from 'react-native'

class Link extends Component {
  static contextTypes = {
    router: React.PropTypes.object
  }

  static defaultProps = {
    component: TouchableHighlight,
    replace: false
  }

  static propTypes = {
    to: PropTypes.string,
    replace: PropTypes.bool,
    component: PropTypes.func
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
    return <Component onPress={this.handlePress} {...rest}/>
  }
}

export default Link
