import React from 'react'
import Link from './Link'

/**
 * An <IndexLink> is used to link to an <IndexRoute>.
 */
const IndexLink = React.createClass({

  render() {
    return <Link {...this.props} onlyActiveOnIndex={true} />
  }

})

export default IndexLink
