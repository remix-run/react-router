import React from 'react'
import { Route, Switch, Link } from 'react-router-dom'
import { B, H, I, PAD, VSpace, darkGray, lightGray, red } from './bricks'
import LoadBundle from './LoadBundle'
import SourceViewer from './SourceViewer'
import FakeBrowser from './FakeBrowser'
import ScrollToMe from './ScrollToMe'

const EXAMPLES = [
  { name: 'Basic',
    path: '/examples/basic',
    load: require('bundle?lazy!babel!../examples/Basic'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!../examples/Basic.js')
  },
  { name: 'URL Parameters',
    path: '/examples/url-params',
    load: require('bundle?lazy!babel!../examples/Params'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!../examples/Params.js')
  },
  { name: 'Redirects (Auth)',
    path: '/examples/auth-workflow',
    load: require('bundle?lazy!babel!../examples/Auth'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!../examples/Auth.js')
  },
  { name: 'Custom Link',
    path: '/examples/custom-link',
    load: require('bundle?lazy!babel!../examples/CustomLink'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!../examples/CustomLink.js')
  },
  { name: 'Preventing Transitions',
    path: '/examples/preventing-transitions',
    load: require('bundle?lazy!babel!../examples/PreventingTransitions'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!../examples/PreventingTransitions.js')
  },
  { name: 'No Match (404)',
    path: '/examples/no-match',
    load: require('bundle?lazy!babel!../examples/NoMatch'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!../examples/NoMatch.js')
  },
  { name: 'Recursive Paths',
    path: '/examples/recursive-paths',
    load: require('bundle?lazy!babel!../examples/Recursive'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!../examples/Recursive.js')
  },
  { name: 'Sidebar',
    path: '/examples/sidebar',
    load: require('bundle?lazy!babel!../examples/Sidebar'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!../examples/Sidebar.js')
  },
  { name: 'Animated Transitions',
    path: '/examples/animated-transitions',
    load: require('bundle?lazy!babel!../examples/Animation'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!../examples/Animation.js')
  },
  { name: 'Ambiguous Matches',
    path: '/examples/ambiguous-matches',
    load: require('bundle?lazy!babel!../examples/Ambiguous'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!../examples/Ambiguous.js')
  },
  { name: 'Route Config',
    path: '/examples/route-config',
    load: require('bundle?lazy!babel!../examples/RouteConfig'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!../examples/RouteConfig.js')
  }
]

const Nav = (props) => (
  <B {...props}>
    <B marginTop={PAD + 'px'}>
      {EXAMPLES.map((example, i) => (
        <B key={i} margin={`${PAD / 2}px 0`}>
          <Route path={example.path} children={({ match }) => (
            <Link to={example.path} style={match ? { color: red } : undefined}>{example.name}</Link>
          )}/>
        </B>
      ))}
    </B>
    <VSpace height={PAD + 'px'}/>
    <B component="p" color={lightGray}>
      All of these examples can be copy pasted into an app created with <CRApp/>.
      Just paste the code into <code>src/App.js</code> of your project.
    </B>
  </B>
)

const CRApp = () => (
  <I color={red} component="a" href="https://github.com/facebookincubator/create-react-app">
    <I component="code">create-react-app</I>
  </I>
)

const Example = ({ load, loadSource, ...props }) => (
  <H {...props}>
    <B height="100%" flex="1" padding={`${PAD / 2}px ${PAD * 2}px`}>
      <LoadBundle load={load} children={mod => (
        <FakeBrowser height="85vh">
          <mod.default/>
        </FakeBrowser>
      )}/>
    </B>
    <B flex="1" padding={`0 ${PAD * 2}px`} overflow="auto">
      <LoadBundle load={loadSource} children={code => (
        <SourceViewer code={code}/>
      )}/>
    </B>
  </H>
)

Example.propTypes = {
  example: React.PropTypes.object
}

class Examples extends React.Component {
  preloadExamples() {
    EXAMPLES.forEach(example => {
      example.load(() => {})
      example.loadSource(() => {})
    })
  }

  componentDidMount() {
    this.preloadExamples()
  }

  render() {
    const routes = EXAMPLES.slice(1).map((example, index) => (
      <Route key={example.path} path={example.path} render={() => <Example {...example}/>}/>
    ))

    routes.push(
      <Route key="basic" render={() => <Example {...EXAMPLES[0]}/>}/>
    )

    return (
      <B>
        <Route exact path="/examples" component={ScrollToMe}/>
        <H minHeight="100vh" background={darkGray} color="white" padding={PAD * 2 + 'px'}>
          <Nav width="300px"/>
          <B flex="1">
            <Switch children={routes}/>
          </B>
        </H>
      </B>
    )
  }
}

export default Examples
