module url from './url';

url.subscribe(clear);

var routes = [];

export function clear() {
  routes.length = 0;
};

export function add(route) {
  console.log('added', route.props.path);
  routes.push(route);
};

export function pathIsActive(path) {
  for (var i = 0, l = routes.length; i < l; i ++) {
    var routePath = routes[i].props.path;
    if (routePath === path) {
      return true;
    }
    var routeSegments = routePath.split('/');
    var pathSegments = path.split('/');
    if (routeSegments.length !== pathSegments.length) {
      continue;
    }
    var builtPath = [];
    for (var i2 = 0, l2 = routeSegments.length; i2 < l2; i2++) {
      if (routeSegments[i2] === pathSegments[i2]) {
        builtPath[i2] = pathSegments[i2];
      }
      if (routeSegments[i2].charAt(0) === ':') {
        builtPath[i2] = pathSegments[i2];
      }
    }
    if (builtPath.join('/') == path) {
      return true;
    }
  }
  return false;
};

