import React from 'react'
import ReactDOM from 'react-dom'
import { Route } from 'react-router-dom'
import { I, H, B, PAD, lightGray, red } from './bricks'
import MarkdownViewer from './MarkdownViewer'
import ScrollToMe from './ScrollToMe'

const docs = [
  { name: 'Installation',
    html: require('../../../../docs/api/Installation.md')
  },
  { name: 'BrowserRouter',
    html: require('../../../../docs/api/BrowserRouter.md')
  },
  { name: 'NativeRouter',
    html: require('../../../../docs/api/NativeRouter.md')
  },
  { name: 'StaticRouter',
    html: require('../../../../docs/api/StaticRouter.md')
  },
  { name: 'HashRouter',
    html: require('../../../../docs/api/HashRouter.md')
  },
  { name: 'MemoryRouter',
    html: require('../../../../docs/api/MemoryRouter.md')
  },
  { name: 'Router',
    html: require('../../../../docs/api/Router.md')
  },
  { name: 'Route',
    html: require('../../../../docs/api/Route.md')
  },
  { name: 'Switch',
    html: require('../../../../docs/api/Switch.md')
  },
  { name: 'Link',
    html: require('../../../../docs/api/Link.md')
  },
  { name: 'NavLink',
    html: require('../../../../docs/api/NavLink.md')
  },
  { name: 'Redirect',
    html: require('../../../../docs/api/Redirect.md')
  },
  { name: 'Prompt',
    html: require('../../../../docs/api/Prompt.md')
  },
  { name: 'withRouter',
    html: require('../../../../docs/api/withRouter.md')
  },
  { name: 'context.router',
    html: require('../../../../docs/api/context.router.md')
  },
  { name: 'history',
    html: require('../../../../docs/api/history.md')
  },
  { name: 'match',
    html: require('../../../../docs/api/match.md')
  }
]

const $ = (node, selector) => (
  [].slice.call(node.querySelectorAll(selector))
)

class APIDocs extends React.Component {
  componentDidMount() {
    const items = $(this.root, '.api-entry').map(entry => {
      const name = $(entry, 'h1')[0].childNodes[1].textContent.trim()
      const hash = $(entry, 'h1 a')[0].hash
      const children = $(entry, 'h2').map(node => ({
        name: node.childNodes[1].textContent.trim(),
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
            {docs.map((doc, i) => (
              <B className="api-entry" key={i} padding="40px 60px">
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
