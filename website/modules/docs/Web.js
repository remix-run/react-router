export default {
  api: [
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

  guides: [
    require("../../../packages/react-router-dom/docs/guides/quick-start.md"),
    require("../../../packages/react-router-dom/docs/guides/basic-components.md"),
    require("../../../packages/react-router-dom/docs/guides/server-rendering.md"),
    require("../../../packages/react-router-dom/docs/guides/code-splitting.md"),
    require("../../../packages/react-router-dom/docs/guides/scroll-restoration.md"),
    require("../../../packages/react-router/docs/guides/philosophy.md"),
    require("../../../packages/react-router/docs/guides/testing.md?web"),
    require("../../../packages/react-router/docs/guides/redux.md"),
    require("../../../packages/react-router/docs/guides/static-routes.md")
  ],

  examples: [
    {
      label: "Basic",
      slug: "basic",
      path: "website/modules/examples/Basic",
      code: require("!raw-loader!../examples/Basic")
    },
    {
      label: "URL Parameters",
      slug: "url-params",
      path: "website/modules/examples/Params",
      code: require("!raw-loader!../examples/Params")
    },
    {
      label: "Redirects (Auth)",
      slug: "auth-workflow",
      path: "website/modules/examples/Auth",
      code: require("!raw-loader!../examples/Auth")
    },
    {
      label: "Custom Link",
      slug: "custom-link",
      path: "website/modules/examples/CustomLink",
      code: require("!raw-loader!../examples/CustomLink")
    },
    {
      label: "Preventing Transitions",
      slug: "preventing-transitions",
      path: "website/modules/examples/PreventingTransitions",
      code: require("!raw-loader!../examples/PreventingTransitions")
    },
    {
      label: "No Match (404)",
      slug: "no-match",
      path: "website/modules/examples/NoMatch",
      code: require("!raw-loader!../examples/NoMatch")
    },
    {
      label: "Recursive Paths",
      slug: "recursive-paths",
      path: "website/modules/examples/Recursive",
      code: require("!raw-loader!../examples/Recursive")
    },
    {
      label: "Sidebar",
      slug: "sidebar",
      path: "website/modules/examples/Sidebar",
      code: require("!raw-loader!../examples/Sidebar")
    },
    {
      label: "Animated Transitions",
      slug: "animated-transitions",
      path: "website/modules/examples/Animation/index",
      code: require("!raw-loader!../examples/Animation/index"),
      extraDependencies: { "react-transition-group": "^2.2.1" }
    },
    {
      label: "Ambiguous Matches",
      slug: "ambiguous-matches",
      path: "website/modules/examples/Ambiguous",
      code: require("!raw-loader!../examples/Ambiguous")
    },
    {
      label: "Route Config",
      slug: "route-config",
      path: "website/modules/examples/RouteConfig",
      code: require("!raw-loader!../examples/RouteConfig")
    },
    {
      label: "Modal Gallery",
      slug: "modal-gallery",
      path: "website/modules/examples/ModalGallery",
      code: require("!raw-loader!../examples/ModalGallery")
    },
    {
      label: "StaticRouter Context",
      slug: "static-router",
      path: "website/modules/examples/StaticRouter",
      code: require("!raw-loader!../examples/StaticRouter")
    },
    {
      label: "Query Parameters",
      slug: "query-parameters",
      path: "website/modules/examples/QueryParams",
      code: require("!raw-loader!../examples/QueryParams")
    }
  ]
};
