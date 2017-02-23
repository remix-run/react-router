export default {
  api: [
    require('../../../react-router-native/docs/NativeRouter.md')
  ],
  examples: [
    { label: 'Basic',
      slug: 'Basic',
      loadSource: require('bundle?lazy!!prismjs?lang=jsx!../../../react-router-native/examples/BoringExample.js')
    }
  ],
  guides: [
    require('../../../react-router-native/guides/quick-start.md'),
    require('../../../react-router-native/guides/deep-linking.md'),
    require('../../../react-router-native/guides/animation.md'),
  ]
}
