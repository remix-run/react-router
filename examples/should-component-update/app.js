import React from 'react'
import { render } from 'react-dom'
import { Router, Route, Link, browserHistory } from 'react-router'

import withExampleBasename from '../withExampleBasename'

class LinkWrapper extends React.Component {
  shouldComponentUpdate() {
    return false
  }

  render() {
    return (
      <div>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/hello/bob" activeStyle={{ color: 'red' }}>Hello</Link></li>
          <li><Link to="/goodbye" activeStyle={{ color: 'red' }}>Goodbye</Link></li>
        </ul>
        {this.props.children}
      </div>
    )
  }
}

const Hello = ({ params }) => (
  <div>Hello {params.name}!</div>
)

const Goodbye = () => (
  <div>Goodbye</div>
)

render((
  <Router history={withExampleBasename(browserHistory, __dirname)}>
    <Route path="/" component={LinkWrapper}>
      <Route path="goodbye" component={Goodbye} />
      <Route path="hello/:name" component={Hello} />
    </Route>
  </Router>
), document.getElementById('example'))
