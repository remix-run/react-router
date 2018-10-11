export default {
  api: [
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
      appetizeURL: "https://appetize.io/embed/kq15zzzz6u328rvg49bdu75vum",
      loadSource: require("../../../packages/react-router-native/examples/BasicExample.js?prismjs")
    },
    {
      label: "URL Parameters",
      slug: "url-params",
      appetizeURL: "https://appetize.io/embed/gudt9n7654nawc85ufn4fa78uw",
      loadSource: require("../../../packages/react-router-native/examples/Params.js?prismjs")
    },
    {
      label: "Redirects (Auth)",
      slug: "auth-workflow",
      appetizeURL: "https://appetize.io/embed/77urbu5w9g111yeauhe59cac6w",
      loadSource: require("../../../packages/react-router-native/examples/Auth.js?prismjs")
    },
    {
      label: "Custom Link",
      slug: "custom-link",
      appetizeURL: "https://appetize.io/embed/0tyewzy1w3d47n8bqvfwfw7k88",
      loadSource: require("../../../packages/react-router-native/examples/CustomLink.js?prismjs")
    },
    {
      label: "Preventing Transitions",
      slug: "preventing-transitions",
      appetizeURL: "https://appetize.io/embed/vdudnenr9rzv323tty60th51ag",
      loadSource: require("../../../packages/react-router-native/examples/PreventingTransitions.js?prismjs")
    },
    {
      label: "No Match",
      slug: "no-match",
      appetizeURL: "https://appetize.io/embed/cbp7d494t1g9jvb7fvgjt4fun4",
      loadSource: require("../../../packages/react-router-native/examples/NoMatch.js?prismjs")
    },
    {
      label: "Recursive Paths",
      slug: "recursive-paths",
      appetizeURL: "https://appetize.io/embed/7jtxzvxhrqgg48ffy6nj5n5gmc",
      loadSource: require("../../../packages/react-router-native/examples/Recursive.js?prismjs")
    },
    {
      label: "Sidebar",
      slug: "sidebar",
      appetizeURL: "https://appetize.io/embed/t91v5044ay0vktbvbwhw580ax0",
      loadSource: require("../../../packages/react-router-native/examples/Sidebar.js?prismjs")
    },
    {
      label: "Ambiguous Matches",
      slug: "ambiguous-matches",
      appetizeURL: "https://appetize.io/embed/0xzpxy9vxb9z64zd3auyz1c3h0",
      loadSource: require("../../../packages/react-router-native/examples/Ambiguous.js?prismjs")
    },
    {
      label: "Route Config",
      slug: "route-config",
      appetizeURL: "https://appetize.io/embed/kb15rx5ngmuf78hh3hefg7kh5g",
      loadSource: require("../../../packages/react-router-native/examples/RouteConfig.js?prismjs")
    }
  ],
  guides: [
    require("../../../packages/react-router/docs/guides/philosophy.md"),
    require("../../../packages/react-router-native/docs/guides/quick-start.md"),
    require("../../../packages/react-router-native/docs/guides/deep-linking.md"),
    require("../../../packages/react-router-native/docs/guides/animation.md"),
    require("../../../packages/react-router/docs/guides/redux.md"),
    require("../../../packages/react-router/docs/guides/blocked-updates.md")
  ]
};
