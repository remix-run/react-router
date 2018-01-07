import React from 'react'
import PropTypes from 'prop-types'
import { TouchableHighlight } from 'react-native'

class Link extends React.PureComponent {
  static contextTypes = {
    router: PropTypes.shape({
      history: PropTypes.shape({
        push: PropTypes.func.isRequired,
        replace: PropTypes.func.isRequired
      }).isRequired
    }).isRequired
  }

  static propTypes = {
    onPress: PropTypes.func,
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

  handlePress = (event) => {
    if (this.props.onPress)
      this.props.onPress(event)

    if (!event.defaultPrevented) {
      const { history } = this.context.router
      const { to, replace } = this.props

      if (replace) {
        history.replace(to)
      } else {
        history.push(to)
      }
    }
  }

  render() {
    const { component: Component, to, replace, ...rest } = this.props
    return <Component {...rest} onPress={this.handlePress}/>
  }
}

export default Link
