//var context = require.context('./modules', true, /-test\.js$/);
//context.keys().forEach(context);

require('./modules/__tests__/Router-test');
require('./modules/__tests__/RouteUtils-test');
require('./modules/__tests__/RoutingUtils-test');
require('./modules/__tests__/transitionHooks-test');
require('./modules/__tests__/TransitionHook-test');
require('./modules/__tests__/HashHistory-test');
require('./modules/__tests__/BrowserHistory-test');
require('./modules/__tests__/MemoryHistory-test');
require('./modules/__tests__/Location-test');
require('./modules/__tests__/URLUtils-test');
require('./modules/__tests__/Link-test');
