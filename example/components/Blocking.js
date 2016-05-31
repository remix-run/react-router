import React from 'react'
import { BlockHistory } from 'react-router'

class Blocking extends React.Component {

  state = {
    blockTransitions: false
  }

  handleSubmit = (e) => {
    e.preventDefault()
    e.target.reset()
    this.setState({
      blockTransitions: false
    })
  }

  handleInputChange = (e) => {
    this.setState({
      blockTransitions: e.target.value.length > 0
    })
  }

  render() {
    const { blockTransitions } = this.state
    return (
      <div>
        <h2>Transition Blocking</h2>

        <p>Blocking?: {blockTransitions ? 'Yes, click a link or the back button.' : 'Nope'}</p>

        <BlockHistory
          when={blockTransitions}
          prompt={(location) => (
            `Are you sure you want to go to ${location.pathname}, you started typing in the form`
          )}
        />

        <form onSubmit={this.handleSubmit}>
          <p>
            <input
              onChange={this.handleInputChange}
              placeholder="type to block transitions"
            />
          </p>
          <p>
            <button>Submit to stop blocking</button>
          </p>
        </form>
      </div>
    )
  }

}

export default Blocking

