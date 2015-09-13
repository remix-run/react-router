import React from 'react'
import Link from './Link'

const IndexLink = React.createClass({

  render() {
    return <Link {...this.props} onlyActiveOnIndex={true} />
  }

})

export default IndexLink
