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
    require('../../../packages/react-router-dom/docs/guides/basic-components.md'),
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
      load: require('bundle-loader?lazy!babel-loader!../examples/Basic'),
      loadSource: require('bundle-loader?lazy!!prismjs-loader?lang=jsx!../examples/Basic.js')
    },
    {
      label: 'URL Parameters',
      slug: 'url-params',
      load: require('bundle-loader?lazy!babel-loader!../examples/Params'),
      loadSource: require('bundle-loader?lazy!!prismjs-loader?lang=jsx!../examples/Params.js')
    },
    {
      label: 'Redirects (Auth)',
      slug: 'auth-workflow',
      load: require('bundle-loader?lazy!babel-loader!../examples/Auth'),
      loadSource: require('bundle-loader?lazy!!prismjs-loader?lang=jsx!../examples/Auth.js')
    },
    {
      label: 'Custom Link',
      slug: 'custom-link',
      load: require('bundle-loader?lazy!babel-loader!../examples/CustomLink'),
      loadSource: require('bundle-loader?lazy!!prismjs-loader?lang=jsx!../examples/CustomLink.js')
    },
    {
      label: 'Preventing Transitions',
      slug: 'preventing-transitions',
      load: require('bundle-loader?lazy!babel-loader!../examples/PreventingTransitions'),
      loadSource: require('bundle-loader?lazy!!prismjs-loader?lang=jsx!../examples/PreventingTransitions.js')
    },
    {
      label: 'No Match (404)',
      slug: 'no-match',
      load: require('bundle-loader?lazy!babel-loader!../examples/NoMatch'),
      loadSource: require('bundle-loader?lazy!!prismjs-loader?lang=jsx!../examples/NoMatch.js')
    },
    {
      label: 'Recursive Paths',
      slug: 'recursive-paths',
      load: require('bundle-loader?lazy!babel-loader!../examples/Recursive'),
      loadSource: require('bundle-loader?lazy!!prismjs-loader?lang=jsx!../examples/Recursive.js')
    },
    {
      label: 'Sidebar',
      slug: 'sidebar',
      load: require('bundle-loader?lazy!babel-loader!../examples/Sidebar'),
      loadSource: require('bundle-loader?lazy!!prismjs-loader?lang=jsx!../examples/Sidebar.js')
    },
    {
      label: 'Animated Transitions',
      slug: 'animated-transitions',
      load: require('bundle-loader?lazy!babel-loader!../examples/Animation'),
      loadSource: require('bundle-loader?lazy!!prismjs-loader?lang=jsx!../examples/Animation.js')
    },
    {
      label: 'Ambiguous Matches',
      slug: 'ambiguous-matches',
      load: require('bundle-loader?lazy!babel-loader!../examples/Ambiguous'),
      loadSource: require('bundle-loader?lazy!!prismjs-loader?lang=jsx!../examples/Ambiguous.js')
    },
    {
      label: 'Route Config',
      slug: 'route-config',
      load: require('bundle-loader?lazy!babel-loader!../examples/RouteConfig'),
      loadSource: require('bundle-loader?lazy!!prismjs-loader?lang=jsx!../examples/RouteConfig.js')
    },
    {
      label: 'Modal Gallery',
      slug: 'modal-gallery',
      load: require('bundle-loader?lazy!babel-loader!../examples/ModalGallery'),
      loadSource: require('bundle-loader?lazy!!prismjs-loader?lang=jsx!../examples/ModalGallery.js')
    },
    {
      label: 'StaticRouter Context',
      slug: 'static-router',
      load: require('bundle-loader?lazy!babel-loader!../examples/StaticRouter'),
      loadSource: require('bundle-loader?lazy!!prismjs-loader?lang=jsx!../examples/StaticRouter.js')
    }
  ]
}
