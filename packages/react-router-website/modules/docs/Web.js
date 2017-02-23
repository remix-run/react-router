export default {
  api: [
    require('../../../react-router-dom/docs/BrowserRouter.md'),
    require('../../../react-router-dom/docs/HashRouter.md'),
    require('../../../react-router-dom/docs/Link.md'),
    require('../../../react-router-dom/docs/NavLink.md'),
  ],

  guides: [
    require('../../../react-router-dom/guides/quick-start.md'),
    require('../../../react-router-dom/guides/server-rendering.md'),
    require('../../../react-router-dom/guides/data-loading.md'),
    require('../../../react-router-dom/guides/code-splitting.md'),
    require('../../../react-router-dom/guides/scroll-restoration.md'),
    require('../../../react-router/guides/testing.md?web')
  ],

  examples: [
    { label: 'Basic',
      slug: 'basic',
      load: require('bundle?lazy!babel!../examples/Basic'),
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../examples/Basic.js')
    },
    { label: 'URL Parameters',
      slug: 'url-params',
      load: require('bundle?lazy!babel!../examples/Params'),
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../examples/Params.js')
    },
    { label: 'Redirects (Auth)',
      slug: 'auth-workflow',
      load: require('bundle?lazy!babel!../examples/Auth'),
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../examples/Auth.js')
    },
    { label: 'Custom Link',
      slug: 'custom-link',
      load: require('bundle?lazy!babel!../examples/CustomLink'),
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../examples/CustomLink.js')
    },
    { label: 'Preventing Transitions',
      slug: 'preventing-transitions',
      load: require('bundle?lazy!babel!../examples/PreventingTransitions'),
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../examples/PreventingTransitions.js')
    },
    { label: 'No Match (404)',
      slug: 'no-match',
      load: require('bundle?lazy!babel!../examples/NoMatch'),
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../examples/NoMatch.js')
    },
    { label: 'Recursive Paths',
      slug: 'recursive-paths',
      load: require('bundle?lazy!babel!../examples/Recursive'),
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../examples/Recursive.js')
    },
    { label: 'Sidebar',
      slug: 'sidebar',
      load: require('bundle?lazy!babel!../examples/Sidebar'),
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../examples/Sidebar.js')
    },
    { label: 'Animated Transitions',
      slug: 'animated-transitions',
      load: require('bundle?lazy!babel!../examples/Animation'),
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../examples/Animation.js')
    },
    { label: 'Ambiguous Matches',
      slug: 'ambiguous-matches',
      load: require('bundle?lazy!babel!../examples/Ambiguous'),
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../examples/Ambiguous.js')
    },
    { label: 'Route Config',
      slug: 'route-config',
      load: require('bundle?lazy!babel!../examples/RouteConfig'),
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../examples/RouteConfig.js')
    }
  ]
}
