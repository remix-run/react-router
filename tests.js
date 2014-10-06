require('./modules/components/__tests__/DefaultRoute-test');
require('./modules/components/__tests__/Link-test');
require('./modules/components/__tests__/NotFoundRoute-test');
require('./modules/components/__tests__/Routes-test');

require('./modules/mixins/__tests__/ActiveContext-test');
require('./modules/mixins/__tests__/AsyncState-test');
require('./modules/mixins/__tests__/LocationContext-test');
require('./modules/mixins/__tests__/Navigation-test');
require('./modules/mixins/__tests__/RouteContext-test');
require('./modules/mixins/__tests__/ScrollContext-test');

require('./modules/stores/__tests__/PathStore-test');

require('./modules/utils/__tests__/Path-test');


var PathStore = require('./modules/stores/PathStore');

afterEach(function () {
  // For some reason unmountComponentAtNode doesn't call componentWillUnmount :/
  PathStore.removeAllChangeListeners();
});
