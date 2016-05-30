/*eslint no-console: 0*/
import React from 'react'
import { render } from 'react-dom'
import { History, Link, MatchLocation, NoMatches } from 'react-history'

import Auth from './components/Auth'
import Params from './components/Params'
import Recursive from './components/Recursive'
import NestedNoMatch from './components/NestedNoMatch'

const Index = () => (
  <h1>Welcome to the future of routing with React!</h1>
)

const NavLink = (props) => (
  <Link {...props} activeStyle={{ color: 'hsl(10, 50%, 50%)' }}/>
)

class App extends React.Component {
  render() {
    return (
      <History>
        <h1>History!</h1>
        <nav>
          <NavLink to="/" activeOnlyWhenExact>Home</NavLink> | {' '}
          <NavLink to="/auth">Auth Example</NavLink> | {' '}
          <NavLink to="/params">Dynamic Segment Params</NavLink> | {' '}
          <NavLink to="/recursive">Recursive Urls</NavLink> | {' '}
          <NavLink to="/no-match">No Match Handling</NavLink> | {' '}
          <NavLink to="/nested-no-match">Nested No Match Handling</NavLink>
        </nav>

        <MatchLocation exactly pattern="/" children={Index}/>
        <MatchLocation pattern="/auth" children={Auth}/>
        <MatchLocation pattern="/params" children={Params}/>
        <MatchLocation pattern="/recursive" children={Recursive}/>
        <MatchLocation pattern="/nested-no-match" children={NestedNoMatch}/>

        <NoMatches children={({ location }) => (
          <div>
            <h2>No Match Handling</h2>
            <p>Nothing matched <code>{location.pathname}</code>.</p>
            <p><Link to={`/${Math.random()}`}>Try something random</Link>?</p>
          </div>
        )}/>

      </History>
    )
  }
}


render(<App/>, document.getElementById('app'))

//class Account extends React.Component {

  //// this is a bit of work to block a transition, BUT IT WORKS GREAT :D
  //// can clean up with a history enhancer or, dare I suggest, a
  //// higher order component? I think HoC might be the way to go :|
  //static contextTypes = { history: object }

  //blockHistory = () => {
    //if (!this.unlistenBefore) {
      //this.unlistenBefore = this.context.history.listenBefore((location) => (
        //`Are you sure you want to go to ${location.pathname} before submitting the form?`
      //))
    //}
  //}

  //unblockHistory = () => {
    //if (this.unlistenBefore) {
      //this.unlistenBefore()
      //this.unlistenBefore = null
    //}
  //}

  //componentWillUnmount = this.unblockHistory

  //handleSubmit = (event) => {
    //event.preventDefault()
    //event.target.reset()
    //this.unblockHistory()
  //}

  //render() {
    //return (
      //<div>
        //<h3>Account {this.props.params.id}</h3>
        //<form
          //onChange={this.blockHistory}
          //onSubmit={this.handleSubmit}
        //>
          //<input placeholder="type here to block history transitions"/>
          //<button type="submit">
            //Submit (and unblock)
          //</button>
        //</form>
        //<Stringify val={this.props}/>
      //</div>
    //)
  //}
//}


