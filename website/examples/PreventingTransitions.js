import React from 'react'
import Router from 'react-router/BrowserRouter'
import Match from 'react-router/Match'
import Miss from 'react-router/Miss'
import Link from 'react-router/Link'
import Redirect from 'react-router/Redirect'
import NavigationPrompt from 'react-router/NavigationPrompt'

const PreventingTransitionsExample = () => (
  <Router>
    <div>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/one">One</Link></li>
        <li><Link to="/two">Two</Link></li>
      </ul>

      <Match pattern="/" exactly component={Form}/>
      <Match pattern="/one" render={() => <h3>One</h3>}/>
      <Match pattern="/two" render={() => <h3>Two</h3>}/>
    </div>
  </Router>
)

class Form extends React.Component {
  state = {
    blockTransitions: false
  }

  render() {
    const { blockTransitions } = this.state
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.target.reset()
          this.setState({
            blockTransitions: false
          })
        }}
      >
        {blockTransitions && (
          <NavigationPrompt
            message={(location) => (
              `Are you sure you want to go to ${location.pathname}`
            )}
          />
        )}

        <p>
          Blocking?: {blockTransitions ?
            'Yes, click a link or the back button.' :
            'Nope'
          }
        </p>

        <p>
          <input
            placeholder="type to block transitions"
            onChange={(e) => {
              this.setState({
                blockTransitions: e.target.value.length > 0
              })
            }}
          />
        </p>

        <p>
          <button>Submit to stop blocking</button>
        </p>
      </form>
    )
  }
}

export default PreventingTransitionsExample
