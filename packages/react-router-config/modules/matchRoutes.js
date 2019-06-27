import { matchPath, Router } from "react-router";

function matchRoutes(routes, pathname, /*not public API*/ branch = []) {
  routes.some(route => {
    const parentMatch =
      branch[branch.length - 1] && branch[branch.length - 1].match;

    const match = route.path
      ? matchPath(pathname, route, parentMatch && parentMatch.path)
      : parentMatch
        ? parentMatch // use parent match
        : Router.computeRootMatch(pathname); // use default "root" match

    if (match) {
      branch.push({ route, match });

      if (route.routes) {
        matchRoutes(route.routes, pathname, branch);
      }
    }

    return match;
  });

  return branch;
}

export default matchRoutes;
