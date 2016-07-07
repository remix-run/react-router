import React, { PropTypes } from 'react'
import {
  router as routerType
} from './PropTypes'

class Redirect extends React.Component {
  static propTypes = {
    to: PropTypes.string.isRequired
  }

  static contextTypes = {
    router: routerType.isRequired
  }

  componentWillMount() {
    this.context.router.replaceWith(this.props.to)
  }

  render() {
    return null
  }
}

export default Redirect
