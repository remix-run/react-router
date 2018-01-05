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
      load: require('../examples/Basic?bundle'),
      loadSource: require('../examples/Basic.js?prismjs')
    },
    {
      label: 'URL Parameters',
      slug: 'url-params',
      load: require('../examples/Params?bundle'),
      loadSource: require('../examples/Params.js?prismjs')
    },
    {
      label: 'Redirects (Auth)',
      slug: 'auth-workflow',
      load: require('../examples/Auth?bundle'),
      loadSource: require('../examples/Auth.js?prismjs')
    },
    {
      label: 'Custom Link',
      slug: 'custom-link',
      load: require('../examples/CustomLink?bundle'),
      loadSource: require('../examples/CustomLink.js?prismjs')
    },
    {
      label: 'Preventing Transitions',
      slug: 'preventing-transitions',
      load: require('../examples/PreventingTransitions?bundle'),
      loadSource: require('../examples/PreventingTransitions.js?prismjs')
    },
    {
      label: 'No Match (404)',
      slug: 'no-match',
      load: require('../examples/NoMatch?bundle'),
      loadSource: require('../examples/NoMatch.js?prismjs')
    },
    {
      label: 'Recursive Paths',
      slug: 'recursive-paths',
      load: require('../examples/Recursive?bundle'),
      loadSource: require('../examples/Recursive.js?prismjs')
    },
    {
      label: 'Sidebar',
      slug: 'sidebar',
      load: require('../examples/Sidebar?bundle'),
      loadSource: require('../examples/Sidebar.js?prismjs')
    },
    {
      label: 'Animated Transitions',
      slug: 'animated-transitions',
      load: require('../examples/Animation?bundle'),
      loadSource: require('../examples/Animation.js?prismjs')
    },
    {
      label: 'Ambiguous Matches',
      slug: 'ambiguous-matches',
      load: require('../examples/Ambiguous?bundle'),
      loadSource: require('../examples/Ambiguous.js?prismjs')
    },
    {
      label: 'Route Config',
      slug: 'route-config',
      load: require('../examples/RouteConfig?bundle'),
      loadSource: require('../examples/RouteConfig.js?prismjs')
    },
    {
      label: 'Modal Gallery',
      slug: 'modal-gallery',
      load: require('../examples/ModalGallery?bundle'),
      loadSource: require('../examples/ModalGallery.js?prismjs')
    },
    {
      label: 'StaticRouter Context',
      slug: 'static-router',
      load: require('../examples/StaticRouter?bundle'),
      loadSource: require('../examples/StaticRouter.js?prismjs')
    }
  ]
}
