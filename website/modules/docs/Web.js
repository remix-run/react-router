export default {
  api: [
    require('packages/react-router-dom/docs/api/BrowserRouter.md'),
    require('packages/react-router-dom/docs/api/HashRouter.md'),
    require('packages/react-router-dom/docs/api/Link.md'),
    require('packages/react-router-dom/docs/api/NavLink.md'),
    require('packages/react-router-dom/docs/api/Prompt.md'),
    require('packages/react-router/docs/api/MemoryRouter.md?web'),
    require('packages/react-router/docs/api/Redirect.md?web'),
    require('packages/react-router/docs/api/Route.md?web'),
    require('packages/react-router/docs/api/Router.md?web'),
    require('packages/react-router/docs/api/StaticRouter.md?web'),
    require('packages/react-router/docs/api/Switch.md?web'),
    require('packages/react-router/docs/api/history.md?web'),
    require('packages/react-router/docs/api/location.md?web'),
    require('packages/react-router/docs/api/match.md?web'),
    require('packages/react-router/docs/api/matchPath.md?web'),
    require('packages/react-router/docs/api/withRouter.md?web')
  ],

  guides: [
    require('packages/react-router/docs/guides/philosophy.md'),
    require('packages/react-router-dom/docs/guides/basic-components.md'),
    require('packages/react-router-dom/docs/guides/quick-start.md'),
    require('packages/react-router-dom/docs/guides/server-rendering.md'),
    require('packages/react-router-dom/docs/guides/code-splitting.md'),
    require('packages/react-router-dom/docs/guides/scroll-restoration.md'),
    require('packages/react-router/docs/guides/testing.md?web'),
    require('packages/react-router/docs/guides/redux.md'),
    require('packages/react-router/docs/guides/static-routes.md'),
    require('packages/react-router/docs/guides/blocked-updates.md')
  ],

  examples: [
    {
      label: 'Basic',
      slug: 'basic',
      load: require('../../../examples/src/Basic?bundle'),
      loadSource: require('../../../examples/src/Basic.js?prismjs'),
      codesandboxUrl: process.env.CODESANDBOX_URL + '&module=/src/Basic.js'
    },
    {
      label: 'URL Parameters',
      slug: 'url-params',
      load: require('../../../examples/src/Params?bundle'),
      loadSource: require('../../../examples/src/Params.js?prismjs'),
      codesandboxUrl: process.env.CODESANDBOX_URL + '&module=/src/Params.js'
    },
    {
      label: 'Redirects (Auth)',
      slug: 'auth-workflow',
      load: require('../../../examples/src/Auth?bundle'),
      loadSource: require('../../../examples/src/Auth.js?prismjs'),
      codesandboxUrl: process.env.CODESANDBOX_URL + '&module=/src/Auth.js'
    },
    {
      label: 'Custom Link',
      slug: 'custom-link',
      load: require('../../../examples/src/CustomLink?bundle'),
      loadSource: require('../../../examples/src/CustomLink.js?prismjs'),
      codesandboxUrl: process.env.CODESANDBOX_URL + '&module=/src/CustomLink.js'
    },
    {
      label: 'Preventing Transitions',
      slug: 'preventing-transitions',
      load: require('../../../examples/src/PreventingTransitions?bundle'),
      loadSource: require('../../../examples/src/PreventingTransitions.js?prismjs'),
      codesandboxUrl: process.env.CODESANDBOX_URL + '&module=/src/PreventingTransitions.js'
    },
    {
      label: 'No Match (404)',
      slug: 'no-match',
      load: require('../../../examples/src/NoMatch?bundle'),
      loadSource: require('../../../examples/src/NoMatch.js?prismjs'),
      codesandboxUrl: process.env.CODESANDBOX_URL + '&module=/src/NoMatch.js'
    },
    {
      label: 'Recursive Paths',
      slug: 'recursive-paths',
      load: require('../../../examples/src/Recursive?bundle'),
      loadSource: require('../../../examples/src/Recursive.js?prismjs'),
      codesandboxUrl: process.env.CODESANDBOX_URL + '&module=/src/Recursive.js'
    },
    {
      label: 'Sidebar',
      slug: 'sidebar',
      load: require('../../../examples/src/Sidebar?bundle'),
      loadSource: require('../../../examples/src/Sidebar.js?prismjs'),
      codesandboxUrl: process.env.CODESANDBOX_URL + '&module=/src/Sidebar.js'
    },
    {
      label: 'Animated Transitions',
      slug: 'animated-transitions',
      load: require('../../../examples/src/Animation/index.js?bundle'),
      loadSource: require('../../../examples/src/Animation/index.js?prismjs'),
      codesandboxUrl: process.env.CODESANDBOX_URL + '&module=/src/Animation/index.js'
    },
    {
      label: 'Ambiguous Matches',
      slug: 'ambiguous-matches',
      load: require('../../../examples/src/Ambiguous?bundle'),
      loadSource: require('../../../examples/src/Ambiguous.js?prismjs'),
      codesandboxUrl: process.env.CODESANDBOX_URL + '&module=/src/Ambiguous.js'
    },
    {
      label: 'Route Config',
      slug: 'route-config',
      load: require('../../../examples/src/RouteConfig?bundle'),
      loadSource: require('../../../examples/src/RouteConfig.js?prismjs'),
      codesandboxUrl: process.env.CODESANDBOX_URL + '&module=/src/RouteConfig.js'
    },
    {
      label: 'Modal Gallery',
      slug: 'modal-gallery',
      load: require('../../../examples/src/ModalGallery?bundle'),
      loadSource: require('../../../examples/src/ModalGallery.js?prismjs'),
      codesandboxUrl: process.env.CODESANDBOX_URL + '&module=/src/ModalGallery.js'
    },
    {
      label: 'StaticRouter Context',
      slug: 'static-router',
      load: require('../../../examples/src/StaticRouter?bundle'),
      loadSource: require('../../../examples/src/StaticRouter.js?prismjs'),
      codesandboxUrl: process.env.CODESANDBOX_URL + '&module=/src/StaticRouter.js'
    }
  ]
}
