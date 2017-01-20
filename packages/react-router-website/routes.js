export const EXAMPLES = [
  { name: 'Basic',
    path: '/examples/basic',
    load: require('bundle?lazy!babel!./examples/Basic'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!./examples/Basic.js')
  },
  { name: 'URL Parameters',
    path: '/examples/url-params',
    load: require('bundle?lazy!babel!./examples/Params'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!./examples/Params.js')
  },
  { name: 'Redirects (Auth)',
    path: '/examples/auth-workflow',
    load: require('bundle?lazy!babel!./examples/Auth'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!./examples/Auth.js')
  },
  { name: 'Custom Link',
    path: '/examples/custom-link',
    load: require('bundle?lazy!babel!./examples/CustomLink'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!./examples/CustomLink.js')
  },
  { name: 'Preventing Transitions',
    path: '/examples/preventing-transitions',
    load: require('bundle?lazy!babel!./examples/PreventingTransitions'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!./examples/PreventingTransitions.js')
  },
  { name: 'No Match (404)',
    path: '/examples/no-match',
    load: require('bundle?lazy!babel!./examples/NoMatch'),
    loadSource: require('bundle?lazy!!prismjs?lang=jsx!./examples/NoMatch.js')
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
