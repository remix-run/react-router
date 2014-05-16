var tree = {};

export function storeFromComponent(routesComponent) {
  routesComponent.props.children.forEach(function(route) {
    var name = route.props.name;
    if (tree[name]) {
      throw new Error('You already have a route named `'+name);
    }
    tree[name] = route;
  });
}

export function lookup(name) {
  return tree[name];
}

