import React from 'react'
import { render } from 'react-dom'
import { Router, Link, MatchLocation } from 'react-router'
import { H, V, B, GRAY, RED, PAD } from './components/layout'
import LoadingDots from './components/LoadingDots'
import FakeBrowser from './components/FakeBrowser'
import SourceViewer from './components/SourceViewer'

const { string } = React.PropTypes

const Nav = (props) => (
  <B {...props}
    padding={`${PAD}px`}
    height="100%"
    overflowX="hidden"
    overflowY="auto"
  />
)

const Main = (props) => (
  <V {...props}
    flex="1"
    padding={`${PAD}px ${PAD*5}px`}
    height="100%"
    overflow="auto"
  />
)

const NavItem = ({ name, path }, index) => (
  <B key={index} component="li">
    <B
      component={Link}
      props={{
        to: path,
        activeStyle: {
          color: RED
        }
      }}
    >{name}</B>
  </B>
)

NavItem.propTypes = { name: string, path: string }

const Break = () => (
  <B component="hr" margin={`${PAD*2}px 0`}/>
)

const NavHeader = (props) => (
  <B {...props}
    component="h2"
    fontSize="75%"
    fontWeight="bold"
    textTransform="uppercase"
    color={GRAY}
  />
)

class LoadBundle extends React.Component {

  state = { mod: null }

  componentDidMount() {
    this.props.load((mod) => {
      this.setState({ mod })
    })
  }

  render() {
    const { children:Child } = this.props
    const { mod } = this.state
    return mod ? <Child mod={mod} /> : <B><LoadingDots/></B>
  }

}

const Header = (props) => (
  <B {...props}
    fontSize="300%"
    fontWeight="100"
    fontFamily="Helvetica Neue, sans-serif"
    textAlign="center"
  />
)

const PAGES = [
  { name: 'Philosophy', path: '/philosophy' },
  { name: 'Quick Start', path: '/quick-start' }
]

const EXAMPLES = [
  {
    name: 'URL Parameters',
    path: '/url-parameters',
    load: require('bundle?lazy!./examples/Params'),
    loadSource: (cb) => {
      const stuff = require('raw!./.examples/Params.js')
      cb(stuff)
    }
  },
  { name: 'Redirects (Auth Workflow)', path: '/auth-workflow' },
  { name: 'Blocking Transitions', path: '/blocking-transitions' },
  { name: 'No Match Handling', path: '/no-match-handling' },
  { name: 'Redux', path: '/redux-integration' },
  { name: 'Relative Links', path: '/relative-links' },
  { name: 'Pinterest-Style UI', path: '/pinterest-style-ui' },
  { name: 'Mobile-Style "Nav Stacks"', path: '/mobile-style-nav-stacks' },
  { name: 'Animated Transitions', path: '/animated-transitions' },
  { name: 'Custom Histories', path: '/custom-histories' },
  { name: 'Server Rendering', path: '/server-rendering' }
]

const COMPONENTS = [
  { name: 'Router', path: '/Router' },
  { name: 'MatchLocation', path: '/MatchLocation' },
  { name: 'NoMatches', path: '/NoMatches' },
  { name: 'Link', path: '/Link' },
  { name: 'History', path: '/History' }
]

class App extends React.Component {
  render() {
    return (
      <Router>
        <H
          lineHeight="1.5"
          fontFamily="sans-serif"
          fontWeight="200"
          width="100%"
          height="100%"
          overflow="hidden"
        >
          <Nav>
            <NavHeader>Pages</NavHeader>
            <B component="ul">
              {PAGES.map(NavItem)}
            </B>
            <Break/>
            <NavHeader>Components</NavHeader>
            <B component="ul">
              {COMPONENTS.map(NavItem)}
            </B>
            <Break/>
            <NavHeader>Examples</NavHeader>
            <B component="ul">
              {EXAMPLES.map(NavItem)}
            </B>
          </Nav>

          <Main>
            {EXAMPLES.map((page, index) => (
              <MatchLocation key={index} pattern={page.path} children={() => (
                <B>
                  <Header>{page.name}</Header>
                  <LoadBundle load={page.load} children={({ mod }) => (
                    <FakeBrowser page={page} children={({ history }) => (
                      <mod.default history={history} />
                    )}/>
                  )}/>
                  <LoadBundle load={page.loadSource} children={({ mod }) => (
                    <SourceViewer code={mod}/>
                  )}/>
                </B>
              )}/>
            ))}
          </Main>
        </H>
      </Router>
    )
  }
}

render(<App/>, document.getElementById('app'))

