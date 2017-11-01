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
      load: require('bundle?lazy!babel!../../../examples/src/Basic'),
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../../../examples/src/Basic.js'),
      codesandboxUrl: process.env.CODESANDBOX_URL + '&module=/Basic.js'
    },
    {
      label: 'URL Parameters',
      slug: 'url-params',
      load: require('bundle?lazy!babel!../../../examples/src/Params'),
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../../../examples/src/Params.js'),
      codesandboxUrl: process.env.CODESANDBOX_URL + '&module=/Params.js'
    },
    {
      label: 'Redirects (Auth)',
      slug: 'auth-workflow',
      load: require('bundle?lazy!babel!../../../examples/src/Auth'),
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../../../examples/src/Auth.js'),
      codesandboxUrl: process.env.CODESANDBOX_URL + '&module=/Auth.js'
    },
    {
      label: 'Custom Link',
      slug: 'custom-link',
      load: require('bundle?lazy!babel!../../../examples/src/CustomLink'),
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../../../examples/src/CustomLink.js'),
      codesandboxUrl: process.env.CODESANDBOX_URL + '&module=/CustomLink.js'
    },
    {
      label: 'Preventing Transitions',
      slug: 'preventing-transitions',
      load: require('bundle?lazy!babel!../../../examples/src/PreventingTransitions'),
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../../../examples/src/PreventingTransitions.js'),
      codesandboxUrl: process.env.CODESANDBOX_URL + '&module=/PreventingTransitions.js'
    },
    {
      label: 'No Match (404)',
      slug: 'no-match',
      load: require('bundle?lazy!babel!../../../examples/src/NoMatch'),
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../../../examples/src/NoMatch.js'),
      codesandboxUrl: process.env.CODESANDBOX_URL + '&module=/NoMatch.js'
    },
    {
      label: 'Recursive Paths',
      slug: 'recursive-paths',
      load: require('bundle?lazy!babel!../../../examples/src/Recursive'),
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../../../examples/src/Recursive.js'),
      codesandboxUrl: process.env.CODESANDBOX_URL + '&module=/Recursive.js'
    },
    {
      label: 'Sidebar',
      slug: 'sidebar',
      load: require('bundle?lazy!babel!../../../examples/src/Sidebar'),
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../../../examples/src/Sidebar.js'),
      codesandboxUrl: process.env.CODESANDBOX_URL + '&module=/Sidebar.js'
    },
    {
      label: 'Animated Transitions',
      slug: 'animated-transitions',
      load: require('bundle?lazy!babel!../../../examples/src/Animation/index'),
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../../../examples/src/Animation/index.js'),
      codesandboxUrl: process.env.CODESANDBOX_URL + '&module=/Animation/index.js'
    },
    {
      label: 'Ambiguous Matches',
      slug: 'ambiguous-matches',
      load: require('bundle?lazy!babel!../../../examples/src/Ambiguous'),
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../../../examples/src/Ambiguous.js'),
      codesandboxUrl: process.env.CODESANDBOX_URL + '&module=/Ambiguous.js'
    },
    {
      label: 'Route Config',
      slug: 'route-config',
      load: require('bundle?lazy!babel!../../../examples/src/RouteConfig'),
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../../../examples/src/RouteConfig.js'),
      codesandboxUrl: process.env.CODESANDBOX_URL + '&module=/RouteConfig.js'
    },
    {
      label: 'Modal Gallery',
      slug: 'modal-gallery',
      load: require('bundle?lazy!babel!../../../examples/src/ModalGallery'),
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../../../examples/src/ModalGallery.js'),
      codesandboxUrl: process.env.CODESANDBOX_URL + '&module=/ModalGallery.js'
    },
    {
      label: 'StaticRouter Context',
      slug: 'static-router',
      load: require('bundle?lazy!babel!../../../examples/src/StaticRouter'),
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../../../examples/src/StaticRouter.js'),
      codesandboxUrl: process.env.CODESANDBOX_URL + '&module=/StaticRouter.js'
    }
  ]
}
