import { matchPath, Router } from "react-router";

function matchRoutes(
  routes,
  pathname,
  exact = false,
  /*not public API*/ parent = []
) {
  for (const route of routes) {
    const match = route.path
      ? matchPath(pathname, route)
      : parent.length
        ? parent[parent.length - 1].match // use parent match
        : Router.computeRootMatch(pathname); // use default "root" match

    if (match) {
      const node = [...parent, { route, match }];
      const res =
        (route.routes && matchRoutes(route.routes, pathname, exact, node)) ||
        node;

      if (!exact || (res && res[res.length - 1].match.isExact)) {
        return res;
      }
    }
  }

  return parent;
}

export default matchRoutes;
