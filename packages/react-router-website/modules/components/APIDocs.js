import React from 'react'
import ReactDOM from 'react-dom'
import { Route } from 'react-router-dom'
import { I, H, B, PAD, lightGray, red } from './bricks'
import MarkdownViewer from './MarkdownViewer'
import ScrollToMe from './ScrollToMe'

const docs = [
  { name: 'Installation',
    html: require('../../../react-router/docs/Installation.md')
  },
  { name: 'BrowserRouter',
    html: require('../../../react-router-dom/docs/BrowserRouter.md')
  },
  { name: 'NativeRouter',
    html: require('../../../react-router-native/docs/NativeRouter.md')
  },
  { name: 'StaticRouter',
    html: require('../../../react-router/docs/StaticRouter.md')
  },
  { name: 'HashRouter',
    html: require('../../../react-router-dom/docs/HashRouter.md')
  },
  { name: 'MemoryRouter',
    html: require('../../../react-router/docs/MemoryRouter.md')
  },
  { name: 'Router',
    html: require('../../../react-router/docs/Router.md')
  },
  { name: 'Route',
    html: require('../../../react-router/docs/Route.md')
  },
  { name: 'Switch',
    html: require('../../../react-router/docs/Switch.md')
  },
  { name: 'Link',
    html: require('../../../react-router-dom/docs/Link.md')
  },
  { name: 'NavLink',
    html: require('../../../react-router-dom/docs/NavLink.md')
  },
  { name: 'Redirect',
    html: require('../../../react-router/docs/Redirect.md')
  },
  { name: 'Prompt',
    html: require('../../../react-router/docs/Prompt.md')
  },
  { name: 'withRouter',
    html: require('../../../react-router/docs/withRouter.md')
  },
  { name: 'context.router',
    html: require('../../../react-router/docs/context.router.md')
  },
  { name: 'history',
    html: require('../../../react-router/docs/history.md')
  },
  { name: 'match',
    html: require('../../../react-router/docs/match.md')
  }
]

const $ = (node, selector) => (
  [].slice.call(node.querySelectorAll(selector))
)

const trimAnchor = (text) => (
  text.replace(/^#\s*/, '')
)

class APIDocs extends React.Component {
  componentDidMount() {
    const items = $(this.root, '.api-entry').map(entry => {
      const name = trimAnchor($(entry, 'h1')[0].innerText)
      const hash = $(entry, 'h1 a')[0].hash
      const children = $(entry, 'h2').map(node => ({
        name: trimAnchor(node.innerText),
        hash: $(node, 'a')[0].hash
      }))

      return { name, hash, children }
    })

    this.renderMenu(items)
  }

  renderMenu(items) {
    const element = (
      <B fontFamily="Monaco, monospace">
        {items.map(item => (
          <B key={item.hash} margin="10px">
            <B component="a" props={{ href: item.hash }} fontWeight="bold" color={red} hoverTextDecoration="underline">{item.name}</B>
            <B marginLeft="20px">
              {item.children.map(({ hash, name }) => (
                <B key={hash} component="a" props={{ href: hash }} color={lightGray} hoverTextDecoration="underline">{name}</B>
              ))}
            </B>
          </B>
        ))}
      </B>
    )

    ReactDOM.render(element, this.menu)
  }

  render() {
    return (
      <B props={{ ref: node => this.root = node }}>
        <Route exact path="/api" component={ScrollToMe}/>
        <H>
          <B
            props={{ ref: node => this.menu = node }}
            position="sticky"
            top="0"
            height="100%"
            overflow="auto"
            fontSize="80%"
            padding="40px"
            background="#f0f0f0"
            height="100vh"
          />
          <B flex="1">
            {docs.map(doc => (
              <B className="api-entry" key={doc.name} padding="40px 60px">
                <MarkdownViewer html={doc.html}/>
              </B>
            ))}
          </B>
        </H>
      </B>
    )
  }
}

export default APIDocs
