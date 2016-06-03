/*eslint no-console: 0*/
import React from 'react'
import { render } from 'react-dom'
import { Router, Link, Match, Miss } from 'react-router'

import Auth from './components/Auth'
import Params from './components/Params'
import Recursive from './components/Recursive'
import NestedMiss from './components/NestedMiss'
import Blocking from './components/Blocking'

const Index = () => (
  <h1>Welcome to the future of routing with React!</h1>
)

const NavLink = (props) => (
  <Link {...props} activeStyle={{ color: 'hsl(10, 50%, 50%)' }}/>
)

const NoMatch = ({ location }) => (
  <div>
    <h2>No Match Handling</h2>
    <p>Nothing matched <code>{location.pathname}</code>.</p>
    <p><Link to={`/${Math.random()}`}>Try something random</Link>?</p>
  </div>
)

class App extends React.Component {
  render() {
    return (
      <Router>
        <h1>Declarative, Composable, React Router!</h1>
        <nav>
          <NavLink to="/" activeOnlyWhenExact>Home</NavLink> | {' '}
          <NavLink to="/auth">Auth Example</NavLink> | {' '}
          <NavLink to="/params">Dynamic Segment Params</NavLink> | {' '}
          <NavLink to="/recursive">Recursive Urls</NavLink> | {' '}
          <NavLink to="/blocking">Transition Blocking</NavLink> | {' '}
          <NavLink to="/no-match">No Match Handling</NavLink> | {' '}
          <NavLink to="/nested-no-match">Nested No Match Handling</NavLink>
        </nav>

        <Match exactly pattern="/" children={Index}/>
        <Match pattern="/auth" children={Auth}/>
        <Match pattern="/params" children={Params}/>
        <Match pattern="/recursive" children={Recursive}/>
        <Match pattern="/blocking" children={Blocking}/>
        <Match pattern="/nested-miss" children={NestedMiss}/>
        <Miss children={NoMatch}/>
      </Router>
    )
  }
}

render(<App/>, document.getElementById('app'))

//import Redux from './components/Redux'
//render(<Redux/>, document.getElementById('app'))

