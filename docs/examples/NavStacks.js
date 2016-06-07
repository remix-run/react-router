import React from 'react'
import { Router, Match, Link, matchPattern } from 'react-router'

////////////////////////////////////////////////////////////
const NavStacksExample = ({ history }) => {
  return (
    <Router history={history} render={({ location }) => (
      <div style={wrapper}>
        <div style={main}>
          <Notes/>
          <MatchWithStack pattern="/one" component={TabContent} location={location}/>
          <MatchWithStack pattern="/two" component={TabContent} location={location}/>
        </div>
        <div style={tabs}>
          <Link to="/one" style={tab}>Tab One</Link>
          <Link to="/two" style={tab}>Tab Two</Link>
        </div>
      </div>
    )}/>
  )
}


////////////////////////////////////////////////////////////

const MatchWithStack = ({ component, ...rest }) => (
  <Stack {...rest} component={component}/>
)

class Stack extends React.Component {

  state = {
    stack: []
  }

  static contextTypes = {
    history: React.PropTypes.object.isRequired
  }

  componentWillMount() {
    const { pattern, location } = this.props
    if (matchPattern(pattern, location)) {
      this.setState({ stack: [ location ] })
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.location !== this.props.location) {
      const { stack } = this.state
      const { history } = this.context
      const willBeActive = matchPattern(nextProps.pattern, nextProps.location)
      const wasActive = matchPattern(this.props.pattern, this.props.location)

      const firstTimeHere = willBeActive && !wasActive && !stack.length
      const alreadyHere = willBeActive && wasActive && stack.length
      const returning = willBeActive && !wasActive && stack.length

      if (firstTimeHere) {
        this.setState({
          stack: [ nextProps.location ]
        })
      }

      else if (alreadyHere) {
        const goingBack = nextProps.location.state &&
          nextProps.location.state.goingBack
        if (goingBack) {
          this.setState({
            stack: stack.slice(0, stack.length - 1)
          })
        } else {
          this.setState({
            stack: stack.concat([ nextProps.location ])
          })
        }
      }

      else if (returning) {
        const lastIndex = stack.length - 1
        const lastLocation = stack[lastIndex]
        this.setState({
          stack: stack.slice(0, lastIndex)
        })
        history.replace(lastLocation)
      }
    }
  }

  render() {
    const { component:Component, ...rest } = this.props
    const { stack } = this.state
    return (
      <Match {...rest} render={(matchProps) => (
        <Component {...matchProps} stack={stack}/>
      )}/>
    )
  }
}


////////////////////////////////////////////////////////////
const TabContent = ({ pattern, stack }) => {
  const backLocation = stack[stack.length - 2]
  return (
    <div>
      <p>
        {backLocation ? (
          <Link to={{
            pathname: backLocation.pathname,
            state: { goingBack: true }
          }}>◀ Back</Link>
        ) : <span>&nbsp;</span>}
      </p>
      <h2>{pattern}</h2>
      <ul>
        <li>
          <p><Link to={`${pattern}/sub`}>Sub</Link></p>
          <Match pattern={`${pattern}/sub`} render={() => (
            <div>
              <h3>Sub for {pattern}</h3>
            </div>
          )}/>
        </li>
      </ul>
    </div>
  )
}


////////////////////////////////////////////////////////////
const Notes = () => (
  <ol style={notes}>
    <li>Click "Tab One", then "Sub", then "Tab Two"</li>
    <li>
      Now click on the "One" tab.
      <ul>
        <li>
          Note the url is not "/one" but is "/one/sub",
          the last location in the stack is preserved
        </li>
        <li>
          Click the "Back" link, note the navigation stack
          is also preserved.
        </li>
      </ul>
    </li>
  </ol>
)

////////////////////////////////////////////////////////////
const wrapper = {
  position: 'absolute',
  top: 0,
  bottom: 0,
  right: 0,
  left: 0,
  display: 'flex',
  flexDirection: 'column'
}

const main = {
  flex: 1,
  overflow: 'auto',
  padding: '10px'
}

const tabs = {
  display: 'flex',
  borderTop: '1px solid hsl(0, 0%, 90%)'
}

const tab = {
  padding: '20px',
  flex: 1,
  textAlign: 'center'
}

const notes = {
  padding: '10px 30px',
  background: 'hsl(53, 81%, 75%)',
  fontSize: '75%'
}

export default NavStacksExample

