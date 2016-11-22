export const EXAMPLES = [
  { name: 'Basic',
    path: '/examples/basic',
    load: require('bundle?lazy!babel!./examples/Basic'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!./examples/Basic.js')
  },
  { name: 'URL Parameters',
    path: '/examples/url-parameters',
    load: require('bundle?lazy!babel!./examples/Params'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!./examples/Params.js')
  },
  { name: 'Redirects (Auth)',
    path: '/examples/auth-workflow',
    load: require('bundle?lazy!babel!./examples/Auth'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!./examples/Auth.js')
  },
  { name: 'Custom Link Component',
    path: '/examples/custom-link-component',
    load: require('bundle?lazy!babel!./examples/CustomLinkComponent'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!./examples/CustomLinkComponent.js')
  },
  { name: 'Preventing Transitions',
    path: '/examples/preventing-transitions',
    load: require('bundle?lazy!babel!./examples/PreventingTransitions'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!./examples/PreventingTransitions.js')
  },
  { name: 'Miss (No Match Handling)',
    path: '/examples/no-match-handling',
    load: require('bundle?lazy!babel!./examples/Miss'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!./examples/Miss.js')
  },
  { name: 'MatchRoutes',
    path: '/examples/match-group',
    load: require('bundle?lazy!babel!./examples/MatchRoutes'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!./examples/MatchRoutes.js')
  },
  { name: 'Query Params',
    path: '/examples/query-params',
    load: require('bundle?lazy!babel!./examples/QueryParams'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!./examples/QueryParams.js')
  },
  { name: 'Recursive Paths',
    path: '/examples/recursive-paths',
    load: require('bundle?lazy!babel!./examples/Recursive'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!./examples/Recursive.js')
  },
  { name: 'Sidebar',
    path: '/examples/sidebar',
    load: require('bundle?lazy!babel!./examples/Sidebar'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!./examples/Sidebar.js')
  },
  { name: 'Animated Transitions',
    path: '/examples/animated-transitions',
    load: require('bundle?lazy!babel!./examples/Animation'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!./examples/Animation.js')
  },
  { name: 'Ambiguous Matches',
    path: '/examples/ambiguous-matches',
    load: require('bundle?lazy!babel!./examples/Ambiguous'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!./examples/Ambiguous.js')
  },
  { name: 'Route Config',
    path: '/examples/route-config',
    load: require('bundle?lazy!babel!./examples/RouteConfig'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!./examples/RouteConfig.js')
  }
]

