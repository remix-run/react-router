export default {
  api: [
    require('../../../react-router-native/docs/api/NativeRouter.md'),
    require('../../../react-router-native/docs/api/Link.md'),
    require('../../../react-router-native/docs/api/DeepLinking.md'),
    require('../../../react-router-native/docs/api/AndroidBackButton.md'),
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
