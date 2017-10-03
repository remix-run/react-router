export default {
  api: [
    require('../../../packages/react-router-dom/docs/api/BrowserRouter.md'),
    require('../../../packages/react-router-dom/docs/api/HashRouter.md'),
    require('../../../packages/react-router-dom/docs/api/Link.md'),
    require('../../../packages/react-router-dom/docs/api/NavLink.md'),
    require('../../../packages/react-router-dom/docs/api/Prompt.md'),
    require('../../../packages/react-router/docs/api/MemoryRouter.md?web'),
    require('../../../packages/react-router/docs/api/Redirect.md?web'),
    require('../../../packages/react-router/docs/api/Route.md?web'),
    require('../../../packages/react-router/docs/api/Router.md?web'),
    require('../../../packages/react-router/docs/api/StaticRouter.md?web'),
    require('../../../packages/react-router/docs/api/Switch.md?web'),
    require('../../../packages/react-router/docs/api/history.md?web'),
    require('../../../packages/react-router/docs/api/location.md?web'),
    require('../../../packages/react-router/docs/api/match.md?web'),
    require('../../../packages/react-router/docs/api/matchPath.md?web'),
    require('../../../packages/react-router/docs/api/withRouter.md?web')
  ],

  guides: [
    require('../../../packages/react-router/docs/guides/philosophy.md'),
    require('../../../packages/react-router-dom/docs/guides/quick-start.md'),
    require('../../../packages/react-router-dom/docs/guides/server-rendering.md'),
    require('../../../packages/react-router-dom/docs/guides/code-splitting.md'),
    require('../../../packages/react-router-dom/docs/guides/scroll-restoration.md'),
    require('../../../packages/react-router/docs/guides/testing.md?web'),
    require('../../../packages/react-router/docs/guides/redux.md'),
    require('../../../packages/react-router/docs/guides/static-routes.md'),
    require('../../../packages/react-router/docs/guides/blocked-updates.md')
  ],

  examples: [
    {
      label: 'Basic',
      slug: 'basic',
      load: require('bundle?lazy!babel!../examples/basic/src/Basic'),
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../examples/basic/src/Basic.js')
    },
    {
      label: 'URL Parameters',
      slug: 'url-params',
      load: require('bundle?lazy!babel!../examples/params/src/Params'),
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../examples/params/src/Params.js')
    },
    {
      label: 'Redirects (Auth)',
      slug: 'auth-workflow',
      load: require('bundle?lazy!babel!../examples/auth/src/Auth'),
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../examples/auth/src/Auth.js')
    },
    {
      label: 'Custom Link',
      slug: 'custom-link',
      load: require('bundle?lazy!babel!../examples/custom-link/src/CustomLink'),
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../examples/custom-link/src/CustomLink.js')
    },
    {
      label: 'Preventing Transitions',
      slug: 'preventing-transitions',
      load: require('bundle?lazy!babel!../examples/preventing-transitions/src/PreventingTransitions'),
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../examples/preventing-transitions/src/PreventingTransitions.js')
    },
    {
      label: 'No Match (404)',
      slug: 'no-match',
      load: require('bundle?lazy!babel!../examples/no-match/src/NoMatch'),
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../examples/no-match/src/NoMatch.js')
    },
    {
      label: 'Recursive Paths',
      slug: 'recursive-paths',
      load: require('bundle?lazy!babel!../examples/recursive/src/Recursive'),
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../examples/recursive/src/Recursive.js')
    },
    {
      label: 'Sidebar',
      slug: 'sidebar',
      load: require('bundle?lazy!babel!../examples/sidebar/src/Sidebar'),
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../examples/sidebar/src/Sidebar.js')
    },
    {
      label: 'Animated Transitions',
      slug: 'animated-transitions',
      load: require('bundle?lazy!babel!../examples/animation/src/Animation'),
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../examples/animation/src/Animation.js')
    },
    {
      label: 'Ambiguous Matches',
      slug: 'ambiguous-matches',
      load: require('bundle?lazy!babel!../examples/ambiguous/src/Ambiguous'),
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../examples/ambiguous/src/Ambiguous.js')
    },
    {
      label: 'Route Config',
      slug: 'route-config',
      load: require('bundle?lazy!babel!../examples/route-config/src/RouteConfig'),
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../examples/route-config/src/RouteConfig.js')
    },
    {
      label: 'Modal Gallery',
      slug: 'modal-gallery',
      load: require('bundle?lazy!babel!../examples/modal-gallery/src/ModalGallery'),
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../examples/modal-gallery/src/ModalGallery.js')
    },
    {
      label: 'StaticRouter Context',
      slug: 'static-router',
      load: require('bundle?lazy!babel!../examples/static-router/src/StaticRouter'),
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../examples/static-router/src/StaticRouter.js')
    }
  ]
}
