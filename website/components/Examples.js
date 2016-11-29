import React from 'react'
import LoadBundle from './LoadBundle'
import SourceViewer from './SourceViewer'
import FakeBrowser from './FakeBrowser'
import ScrollToMe from './ScrollToMe'
import { B, H, I, PAD, VSpace, darkGray, lightGray, red } from './bricks'
import { EXAMPLES } from '../routes'
import Link from '../../modules/Link'
import Match from '../../modules/Match'
import MatchRoutes from '../../modules/MatchRoutes'

const Nav = (props) => (
  <B {...props}>
    <B marginTop={PAD+'px'}>
      {EXAMPLES.map((example, i) => (
        <B key={i} margin={`${PAD/2}px 0`}>
          <Link to={example.path} activeStyle={{color: red}}>
            {example.name}
          </Link>
        </B>
      ))}
    </B>
    <VSpace height={PAD+'px'}/>
    <B component="p" color={lightGray}>
      All of these examples can be copy pasted into an app created with <Crapp/>.
      Just paste the code into <code>src/App.js</code> of your project.
    </B>
  </B>
)

const Crapp = () => (
  <I color={red} component="a" href="https://github.com/facebookincubator/create-react-app">
    <I component="code">create-react-app</I>
  </I>
)

const Example = ({ example, ...props }) => (
  <H {...props}>
    <B height="100%" flex="1" padding={`${PAD/2}px ${PAD*2}px`}>
      <LoadBundle load={example.load} children={({ mod }) => (
        <FakeBrowser height="85vh" page={example} children={(props) => (
          <mod.default {...props} />
        )}/>
      )}/>
    </B>

    <B flex="1" padding={`0 ${PAD*2}px`} overflow="auto">
      <LoadBundle load={example.loadSource} children={({ mod }) => (
        <SourceViewer code={mod}/>
      )}/>
    </B>
  </H>
)

Example.propTypes = { example: React.PropTypes.object }

class Examples extends React.Component {
  componentDidMount() {
    this.eagerlyLoadExamples()
  }

  eagerlyLoadExamples() {
    EXAMPLES.forEach((example) => {
      example.load(() => {})
      example.loadSource(() => {})
    })
  }

  render() {
    return (
      <B>
        <Match pattern="/examples" component={ScrollToMe}/>
        <H minHeight="100vh" background={darkGray} color="white" padding={PAD*2+'px'}>
          <Nav width="300px"/>
          <B flex="1">
            <MatchRoutes
              renderMiss={() => (
                <Example example={EXAMPLES[0]}/>
              )}
              routes={EXAMPLES.slice(1).map((route, index) => ({
                pattern: route.path,
                render: () => <Example key={index} example={route}/>
              }))}
            />
          </B>
        </H>
      </B>
    )
  }
}

export default Examples
