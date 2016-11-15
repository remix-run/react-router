export const PAGES = [
  { name: 'Home',
    path: '/',
    exactly: true,
    load: require('bundle?lazy!./pages/home.md')
  },
  { name: 'Quick Start',
    path: '/quick-start',
    load: require('bundle?lazy!./pages/quick-start.md')
  }
]

export const EXAMPLES = [
  { name: 'Basic',
    path: '/basic',
    load: require('bundle?lazy!babel!./examples/Basic'),
    loadSource: require('bundle?lazy!prismjs?lang=jsx!./examples/Basic')
  },
  { name: 'URL Parameters',
    path: '/url-parameters',
    load: require('bundle?lazy!babel!./examples/Params'),
    loadSource: require('bundle?lazy!prismjs?lang=jsx!./examples/Params')
  },
  { name: 'Redirects (Auth)',
    path: '/auth-workflow',
    load: require('bundle?lazy!babel!./examples/Auth'),
    loadSource: require('bundle?lazy!prismjs?lang=jsx!./examples/Auth')
  },
  { name: 'Custom Link Component',
    path: '/custom-link-component',
    load: require('bundle?lazy!babel!./examples/CustomLinkComponent'),
    loadSource: require('bundle?lazy!prismjs?lang=jsx!./examples/CustomLinkComponent')
  },
  { name: 'Preventing Transitions',
    path: '/preventing-transitions',
    load: require('bundle?lazy!babel!./examples/PreventingTransitions'),
    loadSource: require('bundle?lazy!prismjs?lang=jsx!./examples/PreventingTransitions')
  },
  { name: 'Miss (No Match Handling)',
    path: '/no-match-handling',
    load: require('bundle?lazy!babel!./examples/Miss'),
    loadSource: require('bundle?lazy!prismjs?lang=jsx!./examples/Miss')
  },
  { name: 'MatchRoutes',
    path: '/match-routes',
    load: require('bundle?lazy!babel!./examples/MatchRoutes'),
    loadSource: require('bundle?lazy!prismjs?lang=jsx!./examples/MatchRoutes')
  },
  { name: 'Query Params',
    path: '/query-params',
    load: require('bundle?lazy!babel!./examples/QueryParams'),
    loadSource: require('bundle?lazy!prismjs?lang=jsx!./examples/QueryParams')
  },
  { name: 'Recursive Paths',
    path: '/recursive-paths',
    load: require('bundle?lazy!babel!./examples/Recursive'),
    loadSource: require('bundle?lazy!prismjs?lang=jsx!./examples/Recursive')
  },
  { name: 'Sidebar',
    path: '/sidebar',
    load: require('bundle?lazy!babel!./examples/Sidebar'),
    loadSource: require('bundle?lazy!prismjs?lang=jsx!./examples/Sidebar')
  },
  { name: 'Animated Transitions',
    path: '/animated-transitions',
    load: require('bundle?lazy!babel!./examples/Animation'),
    loadSource: require('bundle?lazy!prismjs?lang=jsx!./examples/Animation')
  },
  { name: 'Ambiguous Matches',
    path: '/ambiguous-matches',
    load: require('bundle?lazy!babel!./examples/Ambiguous'),
    loadSource: require('bundle?lazy!prismjs?lang=jsx!./examples/Ambiguous')
  },
  { name: 'Route Config',
    path: '/route-config',
    load: require('bundle?lazy!babel!./examples/RouteConfig'),
    loadSource: require('bundle?lazy!prismjs?lang=jsx!./examples/RouteConfig')
  }
]

export const API = [
  { name: 'BrowserRouter',
    path: '/BrowserRouter',
    load: require('bundle?lazy!./api/BrowserRouter.md')
  },
  { name: 'HashRouter',
    path: '/HashRouter',
    load: require('bundle?lazy!./api/HashRouter.md')
  },
  { name: 'MemoryRouter',
    path: '/MemoryRouter',
    load: require('bundle?lazy!./api/MemoryRouter.md')
  },
  { name: 'ServerRouter',
    path: '/ServerRouter',
    load: require('bundle?lazy!./api/ServerRouter.md')
  },
  { name: 'Match',
    path: '/Match',
    load: require('bundle?lazy!./api/Match.md')
  },
  { name: 'Miss',
    path: '/Miss',
    load: require('bundle?lazy!./api/Miss.md')
  },
  { name: 'Link',
    path: '/Link',
    load: require('bundle?lazy!./api/Link.md')
  },
  { name: 'NavigationPrompt',
    path: '/NavigationPrompt',
    load: require('bundle?lazy!./api/NavigationPrompt.md')
  },
  { name: 'Redirect',
    path: '/Redirect',
    load: require('bundle?lazy!./api/Redirect.md')
  }
]
