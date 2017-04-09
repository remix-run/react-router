import React from 'react'
import createReactClass from 'create-react-class'
import Link from './Link'

/**
 * An <IndexLink> is used to link to an <IndexRoute>.
 */
const IndexLink = createReactClass({

  render() {
    return <Link {...this.props} onlyActiveOnIndex={true} />
  }

})

export default IndexLink
