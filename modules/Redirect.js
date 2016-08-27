import React, { PropTypes } from 'react'
import {
  router as routerType
} from './PropTypes'

class Redirect extends React.Component {
  static propTypes = {
    to: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object
    ]).isRequired
  }

  static contextTypes = {
    router: routerType
  }

  componentWillMount() {
    const { router } = this.context
    // so that folks can unit test w/o hassle
    if (router)
      router.replaceWith(this.props.to)
  }

  render() {
    return null
  }
}

export default Redirect
