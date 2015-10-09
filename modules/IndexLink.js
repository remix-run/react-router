import React, { Component } from 'react'
import Link from './Link'

/**
 * An <IndexLink> is used to link to an <IndexRoute>.
 */
class IndexLink extends Component {

  render() {
    return <Link {...this.props} onlyActiveOnIndex={true} />
  }

}

export default IndexLink
