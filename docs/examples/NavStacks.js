import React from 'react'
import { Router, Match, Link, pathIsActive } from 'react-router'

////////////////////////////////////////////////////////////
const NavStacksExample = ({ history }) => {
  return (
    <Router history={history} render={({ location }) => (
      <div style={wrapper}>
        <div style={main}>
          <Match pattern="/" render={() => (
            <ol>
              <li>Click the "One" tab.</li>
              <li>Navigate deeper inside the tab by clicking on "Uno"</li>
              <li>Click on the "Two" tab</li>
              <li>
                Now click on the "One" tab.
                <ul>
                  <li>
                    Note the url is not "/one" but is "/one/uno",
                    the previous url of the tab's nav stack
                  </li>
                </ul>
              </li>
            </ol>
          )}/>
          <Match pattern="/one" component={One}/>
          <Match pattern="/two" component={Two}/>
        </div>
        <div style={tabs}>
          <Tab to="/one" location={location}>One</Tab>
          <Tab to="/two" location={location}>Two</Tab>
        </div>
      </div>
    )}/>
  )
}


////////////////////////////////////////////////////////////
class Tab extends React.Component {

  state = {
    lastLocation: null
  }

  static contextTypes = {
    history: React.PropTypes.object.isRequired
  }

  componentWillMount() {
    const { to, location } = this.props
    if (pathIsActive(to, location)) {
      this.setState({ lastLocation: location })
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.location !== this.props.location) {
      const { lastLocation } = this.state
      const { history } = this.context
      const willBeActive = pathIsActive(nextProps.to, nextProps.location)
      const wasActive = pathIsActive(this.props.to, this.props.location)

      if (willBeActive) {
        if (wasActive) {
          this.setState({
            lastLocation: nextProps.location
          })
        } else if (lastLocation) {
          history.replace(lastLocation)
        }
      }
    }
  }

  render() {
    const { to } = this.props
    return (
      <Link
        to={to}
        style={{ display: 'inline-block' }}
      >{this.props.children}</Link>
    )
  }
}


////////////////////////////////////////////////////////////
const One = ({ pattern }) => (
  <div>
    <h2>One</h2>
    <ul>
      <li>
        <p><Link to={`${pattern}/uno`}>Uno</Link></p>
        <Match pattern={`${pattern}/uno`} render={() => (
          <div>
            <h3>Uno</h3>
            <p><Link to="/one">Back</Link></p>
          </div>
        )}/>
      </li>
    </ul>
  </div>
)


////////////////////////////////////////////////////////////
const Two = ({ pattern }) => (
  <div>
    <h2>Two</h2>
    <ul>
      <li>
        <p><Link to={`${pattern}/dos`}>Dos</Link></p>
        <Match pattern={`${pattern}/dos`} render={() => (
          <div>
            <h3>Dos</h3>
            <p><Link to="/two">Back</Link></p>
          </div>
        )}/>
      </li>
    </ul>
  </div>
)


////////////////////////////////////////////////////////////
const wrapper = {
  position: 'absolute',
  top: 0,
  bottom: 0,
  right: 0,
  left: 0
}

const main = {
  position: 'absolute',
  top: 0,
  bottom: '100px',
  left: 0,
  right: 0,
  overflow: 'auto'
}

const tabs = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: '100px'
}

export default NavStacksExample

