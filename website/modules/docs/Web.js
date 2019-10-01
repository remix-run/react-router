export default {
  api: [
    require("../../../packages/react-router/docs/api/hooks.md?web"),
    require("../../../packages/react-router-dom/docs/api/BrowserRouter.md"),
    require("../../../packages/react-router-dom/docs/api/HashRouter.md"),
    require("../../../packages/react-router-dom/docs/api/Link.md"),
    require("../../../packages/react-router-dom/docs/api/NavLink.md"),
    require("../../../packages/react-router-dom/docs/api/Prompt.md"),
    require("../../../packages/react-router/docs/api/MemoryRouter.md?web"),
    require("../../../packages/react-router/docs/api/Redirect.md?web"),
    require("../../../packages/react-router/docs/api/Route.md?web"),
    require("../../../packages/react-router/docs/api/Router.md?web"),
    require("../../../packages/react-router/docs/api/StaticRouter.md?web"),
    require("../../../packages/react-router/docs/api/Switch.md?web"),
    require("../../../packages/react-router/docs/api/history.md?web"),
    require("../../../packages/react-router/docs/api/location.md?web"),
    require("../../../packages/react-router/docs/api/match.md?web"),
    require("../../../packages/react-router/docs/api/matchPath.md?web"),
    require("../../../packages/react-router/docs/api/withRouter.md?web")
  ],

  examples: [
    {
      label: "Basic",
      slug: "basic",
      path: "packages/react-router-dom/examples/Basic.js",
      code: require("!raw-loader!../../../packages/react-router-dom/examples/Basic.js")
    },
    {
      label: "URL Parameters",
      slug: "url-params",
      path: "packages/react-router-dom/examples/Params.js",
      code: require("!raw-loader!../../../packages/react-router-dom/examples/Params.js")
    },
    {
      label: "Redirects (Auth)",
      slug: "auth-workflow",
      path: "packages/react-router-dom/examples/Auth.js",
      code: require("!raw-loader!../../../packages/react-router-dom/examples/Auth.js")
    },
    {
      label: "Custom Link",
      slug: "custom-link",
      path: "packages/react-router-dom/examples/CustomLink.js",
      code: require("!raw-loader!../../../packages/react-router-dom/examples/CustomLink.js")
    },
    {
      label: "Preventing Transitions",
      slug: "preventing-transitions",
      path: "packages/react-router-dom/examples/PreventingTransitions.js",
      code: require("!raw-loader!../../../packages/react-router-dom/examples/PreventingTransitions.js")
    },
    {
      label: "No Match (404)",
      slug: "no-match",
      path: "packages/react-router-dom/examples/NoMatch.js",
      code: require("!raw-loader!../../../packages/react-router-dom/examples/NoMatch.js")
    },
    {
      label: "Recursive Paths",
      slug: "recursive-paths",
      path: "packages/react-router-dom/examples/Recursive.js",
      code: require("!raw-loader!../../../packages/react-router-dom/examples/Recursive.js")
    },
    {
      label: "Sidebar",
      slug: "sidebar",
      path: "packages/react-router-dom/examples/Sidebar.js",
      code: require("!raw-loader!../../../packages/react-router-dom/examples/Sidebar.js")
    },
    {
      label: "Animated Transitions",
      slug: "animated-transitions",
      path: "packages/react-router-dom/examples/Animation/index.js",
      code: require("!raw-loader!../../../packages/react-router-dom/examples/Animation/index.js"),
      extraDependencies: {
        "react-transition-group": "^2.2.1"
      }
    },
    {
      label: "Ambiguous Matches",
      slug: "ambiguous-matches",
      path: "packages/react-router-dom/examples/Ambiguous.js",
      code: require("!raw-loader!../../../packages/react-router-dom/examples/Ambiguous.js")
    },
    {
      label: "Route Config",
      slug: "route-config",
      path: "packages/react-router-dom/examples/RouteConfig.js",
      code: require("!raw-loader!../../../packages/react-router-dom/examples/RouteConfig.js")
    },
    {
      label: "Modal Gallery",
      slug: "modal-gallery",
      path: "packages/react-router-dom/examples/ModalGallery.js",
      code: require("!raw-loader!../../../packages/react-router-dom/examples/ModalGallery.js")
    },
    {
      label: "StaticRouter Context",
      slug: "static-router",
      path: "packages/react-router-dom/examples/StaticRouter.js",
      code: require("!raw-loader!../../../packages/react-router-dom/examples/StaticRouter.js")
    },
    {
      label: "Query Parameters",
      slug: "query-parameters",
      path: "packages/react-router-dom/examples/QueryParams.js",
      code: require("!raw-loader!../../../packages/react-router-dom/examples/QueryParams.js")
    }
  ],

  guides: [
    require("../../../packages/react-router-dom/docs/guides/quick-start.md"),
    require("../../../packages/react-router-dom/docs/guides/primary-components.md"),
    require("../../../packages/react-router-dom/docs/guides/server-rendering.md"),
    require("../../../packages/react-router-dom/docs/guides/code-splitting.md"),
    require("../../../packages/react-router-dom/docs/guides/scroll-restoration.md"),
    require("../../../packages/react-router/docs/guides/philosophy.md?web"),
    require("../../../packages/react-router/docs/guides/testing.md?web"),
    require("../../../packages/react-router/docs/guides/redux.md?web"),
    require("../../../packages/react-router/docs/guides/static-routes.md?web")
  ]
};
