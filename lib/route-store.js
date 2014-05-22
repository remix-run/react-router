var map = {};

export function registerRoot(root) {
  eachChild(root, register)
}

export function register(route) {
  console.log('registering', route.props.path);
  map[route.props.name] = route;
}

export function unregister(route) {
  delete map[route.props.name];
}

export function lookup(name) {
  return map[name];
}

export function lookupAll() {
  return map;
}

function eachChild(component, iterator) {
  var children = component.props.children;
  if (!children) return;
  (Array.isArray(children) ? children : [children]).forEach(iterator);
}

