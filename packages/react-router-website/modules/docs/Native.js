export default {
  api: [
    require('../../../react-router-native/docs/api/AndroidBackButton.md'),
    require('../../../react-router-native/docs/api/DeepLinking.md'),
    require('../../../react-router-native/docs/api/Link.md'),
    require('../../../react-router-native/docs/api/NativeRouter.md'),
    require('../../../react-router/docs/api/MemoryRouter.md?native'),
    require('../../../react-router/docs/api/Redirect.md?native'),
    require('../../../react-router/docs/api/Route.md?native'),
    require('../../../react-router/docs/api/Router.md?native'),
    require('../../../react-router/docs/api/StaticRouter.md?native'),
    require('../../../react-router/docs/api/Switch.md?native'),
    require('../../../react-router/docs/api/history.md?native'),
    require('../../../react-router/docs/api/location.md?native'),
    require('../../../react-router/docs/api/match.md?native'),
    require('../../../react-router/docs/api/matchPath.md?native'),
    require('../../../react-router/docs/api/withRouter.md?native')
  ],
  examples: [
    { label: 'Basic',
      slug: 'Basic',
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../../../react-router-native/examples/BoringExample.js')
    }
  ],
  guides: [
    require('../../../react-router-native/docs/guides/quick-start.md'),
    require('../../../react-router-native/docs/guides/deep-linking.md'),
    require('../../../react-router-native/docs/guides/animation.md')
  ]
}
