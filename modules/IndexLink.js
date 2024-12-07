import React from 'react'
import Link from './Link'

/**
 * An <IndexLink> is used to link to an <IndexRoute>.
 */
function IndexLink(props) {
  return <Link {...props} onlyActiveOnIndex={true} />
}

export default IndexLink
