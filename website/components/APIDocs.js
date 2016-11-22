import React from 'react'
import { B, PAD, lightGray } from './bricks'
import MarkdownViewer from './MarkdownViewer'

export const API = [
  { name: 'Match',
    path: '/Match',
    html: require('../api/Match.md')
  },
  { name: 'Miss',
    path: '/Miss',
    html: require('../api/Miss.md')
  },
  { name: 'Link',
    path: '/Link',
    html: require('../api/Link.md')
  },
  { name: 'NavigationPrompt',
    path: '/NavigationPrompt',
    html: require('../api/NavigationPrompt.md')
  },
  { name: 'Redirect',
    path: '/Redirect',
    html: require('../api/Redirect.md')
  },
  { name: 'BrowserRouter',
    path: '/BrowserRouter',
    html: require('../api/BrowserRouter.md')
  },
  { name: 'HashRouter',
    path: '/HashRouter',
    html: require('../api/HashRouter.md')
  },
  { name: 'MemoryRouter',
    path: '/MemoryRouter',
    html: require('../api/MemoryRouter.md')
  },
  { name: 'ServerRouter',
    path: '/ServerRouter',
    html: require('../api/ServerRouter.md')
  }
]

const APIDocs = () => (
  <B maxWidth="800px" margin={`${PAD*2}px auto`} padding={PAD*2+'px'}>
    <B component="h2" textTransform="uppercase" color={lightGray} fontWeight="bold" textAlign="center">
      API
    </B>
    {API.map((doc, i) => (
      <B key={i} margin={`${PAD*2}px 0`}>
        <MarkdownViewer html={doc.html}/>
      </B>
    ))}
  </B>
)

export default APIDocs
