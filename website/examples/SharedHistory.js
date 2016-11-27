import React from 'react'
import BrowserRouter from 'react-router/BrowserRouter'
import Router from 'react-router/Router'
import Match from 'react-router/Match'
import Link from 'react-router/Link'
import { createMemoryHistory } from 'history'

class SharedHistoryExample extends React.Component {
  componentWillMount() {
    this.otherHistory = createMemoryHistory();
  }
  render() {
    return (
      <div>
        <BrowserRouter>
          <div>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About</Link></li>
            </ul>
            <Match exactly pattern="/" component={() => <h2>Home</h2>}/>
            <Match pattern="/about" component={() => <h2>About</h2>}/>
          </div>
        </BrowserRouter>
        <hr/>

        <Router history={this.otherHistory}>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/one">One</Link></li>
            <li><Link to="/two">Two</Link></li>
          </ul>
        </Router>
        <Router history={this.otherHistory}>
          <div>
            <Match exactly pattern="/" component={() => <h2>Home</h2>}/>
            <Match pattern="/one" component={() => <h2>One</h2>}/>
            <Match pattern="/two" component={() => <h2>Two</h2>}/>
          </div>
        </Router>
      </div>
    )
  }
}

export default SharedHistoryExample
