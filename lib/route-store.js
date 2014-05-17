var tree = {};

export function register(route) {
  tree[route.props.name] = route;
}

export function unregister(route) {
  delete tree[route.props.name];
}

export function lookup(name) {
  return tree[name];
}

