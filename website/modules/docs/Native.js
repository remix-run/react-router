export default {
  api: [
    require("../../../packages/react-router/docs/api/hooks.md?native"),
    require("../../../packages/react-router-native/docs/api/BackButton.md"),
    require("../../../packages/react-router-native/docs/api/DeepLinking.md"),
    require("../../../packages/react-router-native/docs/api/Link.md"),
    require("../../../packages/react-router-native/docs/api/NativeRouter.md"),
    require("../../../packages/react-router/docs/api/MemoryRouter.md?native"),
    require("../../../packages/react-router/docs/api/Redirect.md?native"),
    require("../../../packages/react-router/docs/api/Route.md?native"),
    require("../../../packages/react-router/docs/api/Router.md?native"),
    require("../../../packages/react-router/docs/api/StaticRouter.md?native"),
    require("../../../packages/react-router/docs/api/Switch.md?native"),
    require("../../../packages/react-router/docs/api/history.md?native"),
    require("../../../packages/react-router/docs/api/location.md?native"),
    require("../../../packages/react-router/docs/api/match.md?native"),
    require("../../../packages/react-router/docs/api/matchPath.md?native"),
    require("../../../packages/react-router/docs/api/withRouter.md?native")
  ],

  examples: [
    {
      label: "Basic",
      slug: "Basic",
      path: "packages/react-router-native/examples/BasicExample.js",
      code: require("!raw-loader!../../../packages/react-router-native/examples/BasicExample.js")
    },
    {
      label: "URL Parameters",
      slug: "url-params",
      path: "packages/react-router-native/examples/Params.js",
      code: require("!raw-loader!../../../packages/react-router-native/examples/Params.js")
    },
    {
      label: "Redirects (Auth)",
      slug: "auth-workflow",
      path: "packages/react-router-native/examples/Auth.js",
      code: require("!raw-loader!../../../packages/react-router-native/examples/Auth.js")
    },
    {
      label: "Custom Link",
      slug: "custom-link",
      path: "packages/react-router-native/examples/CustomLink.js",
      code: require("!raw-loader!../../../packages/react-router-native/examples/CustomLink.js")
    },
    {
      label: "Preventing Transitions",
      slug: "preventing-transitions",
      path: "packages/react-router-native/examples/PreventingTransitions.js",
      code: require("!raw-loader!../../../packages/react-router-native/examples/PreventingTransitions.js")
    },
    {
      label: "No Match",
      slug: "no-match",
      path: "packages/react-router-native/examples/NoMatch.js",
      code: require("!raw-loader!../../../packages/react-router-native/examples/NoMatch.js")
    },
    {
      label: "Recursive Paths",
      slug: "recursive-paths",
      path: "packages/react-router-native/examples/Recursive.js",
      code: require("!raw-loader!../../../packages/react-router-native/examples/Recursive.js")
    },
    {
      label: "Sidebar",
      slug: "sidebar",
      path: "packages/react-router-native/examples/Sidebar.js",
      code: require("!raw-loader!../../../packages/react-router-native/examples/Sidebar.js")
    },
    {
      label: "Ambiguous Matches",
      slug: "ambiguous-matches",
      path: "packages/react-router-native/examples/Ambiguous.js",
      code: require("!raw-loader!../../../packages/react-router-native/examples/Ambiguous.js")
    },
    {
      label: "Route Config",
      slug: "route-config",
      path: "packages/react-router-native/examples/RouteConfig.js",
      code: require("!raw-loader!../../../packages/react-router-native/examples/RouteConfig.js")
    }
  ],

  guides: [
    require("../../../packages/react-router-native/docs/guides/quick-start.md"),
    require("../../../packages/react-router-native/docs/guides/deep-linking.md"),
    require("../../../packages/react-router-native/docs/guides/animation.md"),
    require("../../../packages/react-router/docs/guides/philosophy.md"),
    require("../../../packages/react-router/docs/guides/redux.md")
  ]
};
