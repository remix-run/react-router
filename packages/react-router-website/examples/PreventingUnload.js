import React from 'react'
import Router from 'react-router/BrowserRouter'
import Route from 'react-router/Route'
import Link from 'react-router/Link'
import Prompt from 'react-router/Prompt'

const PreventingTransitionsExample = () => (
  <Router>
    <div>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/one">One</Link></li>
        <li><a href="http://www.google.co.uk">google</a></li>
      </ul>

      <Route path="/" exactly component={Form}/>
      <Route path="/one" render={() => <h3>One</h3>}/>
      <Route path="/two" render={() => <h3>Two</h3>}/>
    </div>
  </Router>
)

class Form extends React.Component {
  state = {
    blockTransitions: false,
    beforeUnload: () => { console.log("custom action"); return "leave"; }
  }

  render() {
    const { blockTransitions, beforeUnload } = this.state
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.target.reset()
          this.setState({
            blockTransitions: false,
            beforeUnload: false
          })
        }}
      >

      <Prompt
        when={blockTransitions}
        beforeUnload={beforeUnload} 
        message={(location) => (
          `Are you sure you want to go to ${location.pathname}`
        )}
      />

        <p>
          Blocking?: {blockTransitions ?
            'Yes, click a link or the back button.' :
            'Nope'
          }
        </p>

        <p>
          beforeUnload?: {typeof beforeUnload === "function" || beforeUnload === true ? 
            'Yes, click google.' :
            'Nope'
          }
        </p>

        <p>
          <input
            placeholder="type to block transitions"
            onChange={(e) => {
              this.setState({
                blockTransitions: e.target.value.length > 0,
                beforeUnload: () => { 
                  console.log("custom action")
                  var dialogText = "leave"
                  e.returnValue = dialogText
                  return dialogText
                }
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