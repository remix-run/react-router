import React from 'react'
import { PAGES, API, EXAMPLES } from '../routes'
import { BrowserRouter as Router, Link, Match, Miss } from '../../modules'
import { H, V, B, GRAY, RED, PAD } from './bricks'
import LoadBundle from './LoadBundle'
import FakeBrowser from './FakeBrowser'
import SourceViewer from './SourceViewer'
import MarkdownViewer from './MarkdownViewer'
import FadeIn from './FadeIn'
import { navItem } from './styles.css'
import logo from '../../logo/Horizontal@2x.png'

const { string } = React.PropTypes

const basename = (() => {
  const a = document.createElement('a')
  a.href = document.baseURI
  return a.pathname.replace(/\/$/, '')
})()

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
    listStyle="none"
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
  <B overflow="auto" flex="1" padding={`${PAD}px ${PAD*4}px`}>
    <FadeIn>
      <V height="100%" maxWidth="800px">
        <LoadBundle load={page.load} children={({ mod }) => (
          <MarkdownViewer html={mod}/>
        )}/>
      </V>
    </FadeIn>
  </B>
)

const App = () => (
  <Router basename={basename}>
    <H
      lineHeight="1.5"
      fontFamily="sans-serif"
      fontWeight="200"
      width="100%"
      height="100%"
      overflow="hidden"
    >
      <Nav className="reset">
        <B component="h1">
          <img
            src={logo}
            alt="React Router"
            style={{
              width: '150px',
              margin: `${PAD}px 0`
            }}
          />
        </B>
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

      <Miss render={() => (
        <B>
          <Header>Whoops</Header>
          <B textAlign="center">Nothing matched. Maybe try some of the examples?</B>
        </B>
      )}/>
    </H>
  </Router>
)

export default App

