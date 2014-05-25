module url from './url';
module routeStore from './route-store';
module path from './path';

export default function(name, params) {
  var route = routeStore.getRouteByName(name);

  if (!route)
    throw new Error('No route with name: ' + name);

  var base = url.getLocation() === 'hash' ? '#/' : '/';

  return base + path.forRoute(route, params);
}
