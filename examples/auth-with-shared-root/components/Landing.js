import React from 'react'
import createReactClass from 'create-react-class'

const Landing = createReactClass({

  render() {
    return (
      <div>
        <h1>Landing Page</h1>
        <p>This page is only shown to unauthenticated users.</p>
        <p>Partial / Lazy loading. Open the network tab while you navigate. Notice that only the required components are downloaded as you navigate around.</p>
      </div>
    )
  }

})

module.exports = Landing
