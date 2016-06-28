import React from 'react'
import { PAGES, API, EXAMPLES } from '../routes'
import createBrowserHistory from 'history/lib/createBrowserHistory'
import useBaseName from 'history/lib/useBaseName'
import { Router, Link, Match, Miss } from 'react-router'
import { H, V, B, GRAY, RED, PAD } from './layout'
import LoadBundle from './LoadBundle'
import FakeBrowser from './FakeBrowser'
import SourceViewer from './SourceViewer'
import MarkdownViewer from './MarkdownViewer'
import FadeIn from './FadeIn'
import { navItem } from './styles.css'

const { string } = React.PropTypes

const stripTrailingSlash = (str) =>
  str.replace(/\/$/, '')

const stripLeadingSlash = (str) =>
  str.replace(/^\//, '')

const basename = (() => {
  const a = document.createElement('a')
  a.href = document.baseURI
  return stripTrailingSlash(a.pathname)
})()

const history = useBaseName(createBrowserHistory)({ basename })

const Nav = (props) => (
  <B {...props}
    padding={`${PAD}px`}
    paddingTop="55px"
    height="100%"
    overflowX="hidden"
    overflowY="auto"
  />
)

const Example = ({ page }) => (
  <V
    flex="1"
    padding={`${PAD}px ${PAD*2}px`}
    height="100%"
    overflow="hidden"
  >
    <FadeIn>
      <V height="100%">
        <Header className="reset">{page.name}</Header>
        <H flex="1">
          <V width="50%" paddingBottom={`${PAD}px`}>
            <LoadBundle load={page.load} children={({ mod }) => (
              <FakeBrowser page={page} children={({ history }) => (
                <mod.default history={history} />
              )}/>
            )}/>
          </V>
          <V width="50%" marginLeft={`${PAD*2}px`}>
            <LoadBundle load={page.loadSource} children={({ mod }) => (
              <SourceViewer code={mod}/>
            )}/>
          </V>
        </H>
      </V>
    </FadeIn>
  </V>
)

const NavList = (props) => (
  <B
    component="ul"
    margin="0"
    padding="0"
    {...props}
  />
)

const NavItem = ({ name, path, exactly }, index) => (
  <B key={index} component="li">
    <Link
      to={path}
      activeOnlyWhenExact={exactly}
      className={navItem}
      activeStyle={{ color: RED }}
    >{name}</Link>
  </B>
)

NavItem.propTypes = { name: string, path: string }

const Break = () => (
  <B component="hr" margin={`${PAD*2}px 0`} border="none"/>
)

const NavHeader = (props) => (
  <B {...props}
    component="h2"
    fontSize="75%"
    fontWeight="bold"
    margin="0"
    textTransform="uppercase"
    color={GRAY}
  />
)

const Header = (props) => (
  <B {...props}
    component="h1"
    fontSize="300%"
    fontWeight="100"
    fontFamily="Helvetica Neue, sans-serif"
    textAlign="center"
    margin={`${PAD}px`}
  />
)

const Page = ({ page }) => (
  <B overflow="auto" flex="1" padding={`${PAD*2}px ${PAD*4}px`}>
    <FadeIn>
      <V height="100%" maxWidth="800px">
        <LoadBundle load={page.load} children={({ mod }) => (
          <MarkdownViewer html={mod}/>
        )}/>
      </V>
    </FadeIn>
  </B>
)

const Home = () => (
  <B>
    <Header>React Router</Header>
    <B component="p">I don’t know what to say here</B>
  </B>
)

class App extends React.Component {
  render() {
    return (
      <Router history={history}>
        <H
          lineHeight="1.5"
          fontFamily="sans-serif"
          fontWeight="200"
          width="100%"
          height="100%"
          overflow="hidden"
        >
          <Nav className="reset">
            <NavHeader>Pages</NavHeader>
            <NavList>
              {PAGES.map(NavItem)}
            </NavList>
            <Break/>

            <NavHeader>API</NavHeader>
            <NavList>
              {API.map(NavItem)}
            </NavList>
            <Break/>

            <NavHeader>Examples</NavHeader>
            <NavList component="ul">
              {EXAMPLES.map(NavItem)}
            </NavList>
          </Nav>

          <B>
            {PAGES.map((page, index) => (
              <Match
                key={index}
                pattern={page.path}
                exactly={page.exactly}
                render={() => <Page page={page}/>}
              />
            ))}

            {EXAMPLES.map((page, index) => (
              <Match
                key={index}
                pattern={page.path}
                render={() => <Example page={page}/>}
              />
            ))}

            {API.map((page, index) => (
              <Match
                key={index}
                pattern={page.path}
                render={() => <Page page={page}/>}
              />
            ))}
          </B>

          <Miss render={() => (
            <B>
              <Header>Whoops</Header>
              <B textAlign="center">Nothing matched. Maybe try some of the examples?</B>
            </B>
          )}/>
        </H>
      </Router>
    )
  }
}

export default App

