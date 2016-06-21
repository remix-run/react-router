export const PAGES = [
  { name: 'Philosophy', path: '/philosophy' },
  { name: 'Quick Start', path: '/quick-start' }
]

export const EXAMPLES = [
  { name: 'Basic',
    path: '/basic',
    load: require('bundle?lazy!./examples/Basic'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!./.examples/Basic.js')
  },
  { name: 'URL Parameters',
    path: '/url-parameters',
    load: require('bundle?lazy!./examples/Params'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!./.examples/Params.js')
  },
  { name: 'Redirects (Auth)',
    path: '/auth-workflow',
    load: require('bundle?lazy!./examples/Auth'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!./.examples/Auth.js')
  },
  { name: 'Blocking Transitions',
    path: '/blocking-transitions',
    load: require('bundle?lazy!./examples/Blocking'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!./.examples/Blocking.js')
  },
  { name: 'Miss (No Match Handling)',
    path: '/no-match-handling',
    load: require('bundle?lazy!./examples/Miss'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!./.examples/Miss.js')
  },
  { name: 'Redux',
    path: '/redux-integration',
    load: require('bundle?lazy!./examples/Redux'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!./.examples/Redux.js')
  },
  { name: 'Recursive Paths',
    path: '/recursive-paths',
    load: require('bundle?lazy!./examples/Recursive'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!./.examples/Recursive.js')
  },
  { name: 'Mobile-Style "Nav Stacks"',
    path: '/mobile-style-nav-stacks',
    load: require('bundle?lazy!./examples/NavStacks'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!./.examples/NavStacks.js')
  },
  { name: 'Sidebar',
    path: '/sidebar',
    load: require('bundle?lazy!./examples/Sidebar'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!./.examples/Sidebar.js')
  },
  { name: 'Animated Transitions',
    path: '/animated-transitions',
    load: require('bundle?lazy!./examples/Animation'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!./.examples/Animation.js')
  },
  { name: 'Ambiguous Matches',
    path: '/ambiguous-matches',
    load: require('bundle?lazy!./examples/Ambiguous'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!./.examples/Ambiguous.js')
  },
  { name: 'Route Config',
    path: '/route-config',
    load: require('bundle?lazy!./examples/RouteConfig'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!./.examples/RouteConfig.js')
  }
]

export const COMPONENTS = [
  { name: 'Router', path: '/Router' },
  { name: 'Match', path: '/Match' },
  { name: 'Miss', path: '/Miss' },
  { name: 'Link', path: '/Link' },
  { name: 'BlockHistory', path: '/BlockHistory' },
  { name: 'Redirect', path: '/Redirect' },
  { name: 'History', path: '/History' }
]
