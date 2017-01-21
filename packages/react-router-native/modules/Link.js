import React, { Component, PropTypes } from 'react'
import { TouchableHighlight } from 'react-native'

class Link extends Component {
  static contextTypes = {
    router: React.PropTypes.object
  }

  static defaultProps = {
    component: TouchableHighlight
  }

  static propTypes = {
    to: PropTypes.oneOf([
      PropTypes.string,
      PropTypes.object
    ]).isRequired
    component: PropTypes.func
  }

  handlePress = () => {
    const { router } = this.context
    const { to } = this.props
    if (replace) {
      router.replaceWith(to)
    } else {
      router.transitionTo(to)
    }
  }

  render() {
    const { component: Component, ...rest }
    return <Component onPress={this.handlePress} {...rest}/>
  }
}

export default Link
