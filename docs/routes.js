export const PAGES = [
  { name: 'Philosophy', path: '/philosophy' },
  { name: 'Quick Start', path: '/quick-start' }
]

export const EXAMPLES = [
  { name: 'URL Parameters',
    path: '/url-parameters',
    load: require('bundle?lazy!./examples/Params'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!./.examples/Params.js')
  },
  { name: 'Redirects (Auth Workflow)',
    path: '/auth-workflow',
    load: require('bundle?lazy!./examples/Auth'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!./.examples/Auth.js')
  },
  { name: 'Blocking Transitions',
    path: '/blocking-transitions',
    load: require('bundle?lazy!./examples/Blocking'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!./.examples/Blocking.js')
  },
  { name: 'No Match Handling with Miss',
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
  { name: 'Relative Links', path: '/relative-links' },
  { name: 'Pinterest-Style UI', path: '/pinterest-style-ui' },
  { name: 'Animated Transitions', path: '/animated-transitions' },
  { name: 'Custom Histories', path: '/custom-histories' },
  { name: 'Server Rendering', path: '/server-rendering' }
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
